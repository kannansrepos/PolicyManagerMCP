using System.Diagnostics;
using PolicyManagerMCP.Observability;

namespace PolicyManagerMCP.Handlers;

public sealed class RequestResponseLoggingHandler(
    ILogger<RequestResponseLoggingHandler> logger,
    ICorrelationContext correlationContext) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();

        logger.LogInformation(
            "Sending HTTP request {Method} {Uri}. CorrelationId: {CorrelationId}",
            request.Method,
            request.RequestUri,
            correlationContext.CorrelationId);

        try
        {
            var response = await base.SendAsync(request, cancellationToken);

            stopwatch.Stop();

            logger.LogInformation(
                "Received HTTP response {StatusCode} for {Method} {Uri} in {ElapsedMs} ms. CorrelationId: {CorrelationId}",
                (int)response.StatusCode,
                request.Method,
                request.RequestUri,
                stopwatch.ElapsedMilliseconds,
                correlationContext.CorrelationId);

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            logger.LogError(
                ex,
                "HTTP request failed for {Method} {Uri} after {ElapsedMs} ms. CorrelationId: {CorrelationId}",
                request.Method,
                request.RequestUri,
                stopwatch.ElapsedMilliseconds,
                correlationContext.CorrelationId);

            throw;
        }
    }
}