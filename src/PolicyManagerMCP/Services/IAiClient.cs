using PolicyManagerMCP.Models;

namespace PolicyManagerMCP.Services;

public interface IAiClient
{
    Task<ChatResponse> SendPromptAsync(string prompt, CancellationToken cancellationToken = default);
}