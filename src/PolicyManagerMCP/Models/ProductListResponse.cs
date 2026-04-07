namespace PolicyManagerMCP.Models;

public sealed class ProductListResponse
{
    public List<ProductDto> Products { get; set; } = new();
    public int Total { get; set; }
    public int Skip { get; set; }
    public int Limit { get; set; }
}