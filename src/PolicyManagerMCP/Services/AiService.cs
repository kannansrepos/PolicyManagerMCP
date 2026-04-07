using System.Text;
using System.Text.Json;
using PolicyManagerMCP.Models;

namespace PolicyManagerMCP.Services;

public class AiService(IHttpClientFactory httpClientFactory, ILogger<AiService> logger, IConfiguration configuration)
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly ILogger<AiService> _logger = logger;
    // Health check — is Ai Model running?
    public async Task<bool> IsAiModelRunningAsync()
    {
        try
        {
            var client = _httpClientFactory.CreateClient(Constants.AiModelHttpClientName);
            var response = await client.GetAsync("/");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }


    public async Task<string> SendMessageAsync(string message)
    {
        var client = _httpClientFactory.CreateClient(Constants.AiModelHttpClientName);
        var aiRequest = new
        {
            model =configuration.GetValue<string>(Constants.AiModel),
            prompt = message,
            stream = false,
            options = new
            {
                num_predict = 500,
                temperature = 0.7
            }
        };
        var content = new StringContent(
            JsonSerializer.Serialize(aiRequest),
            Encoding.UTF8,
            "application/json"
        );
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

        var response = await client.PostAsync("/api/generate", content, cts.Token);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cts.Token);
            _logger.LogError("Ai Model returned error: {Error}", error);
            throw new Exception($"Ai Model error: {error}");
        }

        var responseString = await response.Content.ReadAsStringAsync(cts.Token);
        var result = JsonSerializer.Deserialize<AiResponse>(responseString);

        return result?.response ?? "No response from model.";
    }
}