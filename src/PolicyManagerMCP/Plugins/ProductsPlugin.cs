using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text;
using PolicyManagerMCP.Services;

namespace PolicyManagerMCP.Plugins;

public sealed class ProductsPlugin
{
    private readonly DummyJsonProductClient _client;

    public ProductsPlugin(DummyJsonProductClient client)
    {
        _client = client;
    }

    [KernelFunction("get_sorted_products")]
    [Description("Get products sorted by a field such as title, price, or rating in ascending or descending order.")]
    public async Task<string> GetSortedProductsAsync(
        [Description("Field to sort by. Example: title, price, rating")] string sortBy = "title",
        [Description("Sort order. Use asc or desc")] string order = "asc",
        CancellationToken cancellationToken = default)
    {
        var response = await _client.GetSortedProductsAsync(sortBy, order, cancellationToken);

        if (response?.Products is null || response.Products.Count == 0)
        {
            return "No products were found.";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Found {response.Products.Count} products.");
        sb.AppendLine();

        foreach (var product in response.Products.Take(10))
        {
            sb.AppendLine($"Id: {product.Id}");
            sb.AppendLine($"Title: {product.Title}");
            sb.AppendLine($"Category: {product.Category}");
            sb.AppendLine($"Price: {product.Price}");
            sb.AppendLine($"Rating: {product.Rating}");
            sb.AppendLine($"Stock: {product.Stock}");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    [KernelFunction("get_product_by_id")]
    [Description("Get full details of a product by its id.")]
    public async Task<string> GetProductByIdAsync(
        [Description("The product id")] int productId,
        CancellationToken cancellationToken = default)
    {
        var product = await _client.GetProductByIdAsync(productId, cancellationToken);

        if (product is null)
        {
            return $"No product found for id {productId}.";
        }

        return $"""
        Product Details:
        Id: {product.Id}
        Title: {product.Title}
        Description: {product.Description}
        Category: {product.Category}
        Brand: {product.Brand}
        Price: {product.Price}
        Rating: {product.Rating}
        Stock: {product.Stock}
        """;
    }

    [KernelFunction("search_products")]
    [Description("Search products by keyword such as phone, laptop, watch, or beauty.")]
    public async Task<string> SearchProductsAsync(
        [Description("Search keyword")] string query,
        CancellationToken cancellationToken = default)
    {
        var response = await _client.SearchProductsAsync(query, cancellationToken);

        if (response?.Products is null || response.Products.Count == 0)
        {
            return $"No products found for search term '{query}'.";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Search results for '{query}':");
        sb.AppendLine();

        foreach (var product in response.Products.Take(10))
        {
            sb.AppendLine($"Id: {product.Id}");
            sb.AppendLine($"Title: {product.Title}");
            sb.AppendLine($"Price: {product.Price}");
            sb.AppendLine($"Category: {product.Category}");
            sb.AppendLine($"Rating: {product.Rating}");
            sb.AppendLine();
        }

        return sb.ToString();
    }
    
}