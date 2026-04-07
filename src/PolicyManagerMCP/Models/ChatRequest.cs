namespace PolicyManagerMCP.Models;

public sealed record ChatRequest
{
    public string Prompt { get; set; } = string.Empty;
}