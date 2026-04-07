namespace PolicyManagerMCP.Observability;

public interface ICorrelationContext
{
    string CorrelationId { get; set; }
}