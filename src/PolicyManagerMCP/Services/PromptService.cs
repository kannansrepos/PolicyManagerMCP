namespace PolicyManagerMCP.Services;

public class PromptService(IAiClient aiClient, ILogger<PromptService> logger)
{
    public async Task<string> GenerateAsync(string prompt, CancellationToken cancellationToken = default)
    {
        var response = await aiClient.SendPromptAsync(prompt, cancellationToken);

        logger.LogInformation("AI response received from model {Model}", response.Model);

        return response.Response ?? string.Empty;
    }
}