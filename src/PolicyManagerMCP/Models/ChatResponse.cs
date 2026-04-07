namespace PolicyManagerMCP.Models;

public sealed record ChatResponse
{
    public string? Response { get; set; }
    public string? Model { get; set; }
    public string? RequestId { get; set; }
}