using System.ComponentModel.DataAnnotations;

namespace PolicyManagerMCP.Models;

public sealed class AiModelOptions
{
    public const string SectionName = "AiModel";

    [Required]
    public string BaseUri { get; set; } = string.Empty;
    [Required]
    public string ModelName { get; set; } = string.Empty;

    public string? Token { get; set; }

    public int TimeoutSeconds { get; set; } = 300;

    public string CorrelationHeaderName { get; set; } = "X-Correlation-ID";
}