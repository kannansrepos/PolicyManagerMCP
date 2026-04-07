using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PolicyManagerMCP.Models;
using PolicyManagerMCP.Observability;

namespace PolicyManagerMCP.Services;

public sealed class AiClient(
    HttpClient httpClient,
    ILogger<AiClient> logger,
    IOptions<AiModelOptions> aiOptions,
    ICorrelationContext correlationContext) : IAiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly AiModelOptions _aiOptions=aiOptions.Value;
    
    public async Task<ChatResponse> SendPromptAsync(
        string prompt,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(prompt))
        {
            throw new ArgumentException("Prompt cannot be empty.", nameof(prompt));
        }

        var aiRequest = new
        {
            model =_aiOptions.ModelName,
            prompt,
            stream = false,
            options = new
            {
                num_predict = 500,
                temperature = 0.7
            }
        };

        using var response = await httpClient.PostAsJsonAsync(
            "/api/generate",
            aiRequest,
            JsonOptions,
            cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);
            var resultData = JsonSerializer.Deserialize<ChatResponse>(responseString,JsonOptions);
            return resultData ?? new ChatResponse();
        }

        var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);

        logger.LogWarning(
            "AI API returned non-success status code {StatusCode}. CorrelationId: {CorrelationId}. Body: {Body}",
            (int)response.StatusCode,
            correlationContext.CorrelationId,
            errorBody);

        throw CreateAiClientException(response.StatusCode, errorBody);
    }

    private static Exception CreateAiClientException(HttpStatusCode statusCode, string responseBody)
    {
        return statusCode switch
        {
            HttpStatusCode.BadRequest =>
                new InvalidOperationException($"AI request was invalid. Body: {responseBody}"),

            HttpStatusCode.Unauthorized =>
                new UnauthorizedAccessException($"AI API unauthorized. Body: {responseBody}"),

            HttpStatusCode.Forbidden =>
                new UnauthorizedAccessException($"AI API forbidden. Body: {responseBody}"),

            HttpStatusCode.TooManyRequests =>
                new InvalidOperationException($"AI API rate limited. Body: {responseBody}"),

            HttpStatusCode.InternalServerError or
            HttpStatusCode.BadGateway or
            HttpStatusCode.ServiceUnavailable or
            HttpStatusCode.GatewayTimeout =>
                new HttpRequestException($"AI API temporary server failure. Body: {responseBody}"),

            _ =>
                new HttpRequestException($"AI API returned status {(int)statusCode}. Body: {responseBody}")
        };
    }
}