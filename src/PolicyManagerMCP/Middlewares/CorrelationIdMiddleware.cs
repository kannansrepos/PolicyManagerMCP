using Microsoft.Extensions.Options;
using PolicyManagerMCP.Models;
using PolicyManagerMCP.Observability;

namespace PolicyManagerMCP.Middlewares;

public class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        ICorrelationContext correlationContext,
        IOptions<AiModelOptions> options)
    {
        var headerName = options.Value.CorrelationHeaderName;

        var correlationId = context.Request.Headers.TryGetValue(headerName, out var existing)
                            && !string.IsNullOrWhiteSpace(existing)
            ? existing.ToString()
            : Guid.NewGuid().ToString("N");

        correlationContext.CorrelationId = correlationId;

        context.Response.Headers[headerName] = correlationId;

        await next(context);
    }
}