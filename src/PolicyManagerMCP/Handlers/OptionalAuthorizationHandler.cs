using System.Net.Http.Headers;
using Microsoft.Extensions.Options;
using PolicyManagerMCP.Models;

namespace PolicyManagerMCP.Handlers;

public class OptionalAuthorizationHandler(IOptions<AiModelOptions> options) : DelegatingHandler
{
    private readonly AiModelOptions _options = options.Value;
    
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_options.Token))
        {
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", _options.Token);
        }

        return base.SendAsync(request, cancellationToken);
    }
}