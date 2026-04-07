using Microsoft.Extensions.Options;
using PolicyManagerMCP.Models;

namespace PolicyManagerMCP.Observability;

public sealed class CorrelationIdHandler(
    ICorrelationContext correlationContext,
    IOptions<AiModelOptions> options,
    ILogger<CorrelationIdHandler> logger) : DelegatingHandler
{
    private readonly AiModelOptions _options = options.Value;
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(correlationContext.CorrelationId))
        {
            correlationContext.CorrelationId = Guid.NewGuid().ToString("N");
        }

        if (!request.Headers.Contains(_options.CorrelationHeaderName))
        {
            request.Headers.Add(_options.CorrelationHeaderName, correlationContext.CorrelationId);
        }

        logger.LogDebug(
            "Added correlation id {CorrelationId} to outgoing request {Method} {Uri}",
            correlationContext.CorrelationId,
            request.Method,
            request.RequestUri);

        return base.SendAsync(request, cancellationToken);
    }
}