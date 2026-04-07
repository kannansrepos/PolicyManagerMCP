using System.Net;
using System.Text.Json;
using PolicyManagerMCP.Models;

namespace PolicyManagerMCP.Services;

public sealed class DummyJsonProductClient(
    HttpClient httpClient,
    ILogger<DummyJsonProductClient> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<ProductListResponse> GetSortedProductsAsync(
        string sortBy = "title",
        string order = "asc",
        CancellationToken cancellationToken = default)
    {
        sortBy = string.IsNullOrWhiteSpace(sortBy) ? "title" : sortBy.Trim();
        order = string.IsNullOrWhiteSpace(order) ? "asc" : order.Trim().ToLowerInvariant();

        if (order is not ("asc" or "desc"))
        {
            throw new ArgumentException("Order must be either 'asc' or 'desc'.", nameof(order));
        }

        var url = $"products?sortBy={Uri.EscapeDataString(sortBy)}&order={Uri.EscapeDataString(order)}";

        logger.LogInformation("Calling DummyJson sorted products endpoint: {Url}", url);

        return await GetAsync<ProductListResponse>(url, cancellationToken)
               ?? new ProductListResponse();
    }

    public async Task<ProductDto?> GetProductByIdAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        if (productId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(productId), "Product id must be greater than 0.");
        }

        var url = $"products/{productId}";

        logger.LogInformation("Calling DummyJson product by id endpoint: {Url}", url);

        return await GetAsync<ProductDto>(url, cancellationToken);
    }

    public async Task<ProductListResponse> SearchProductsAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            throw new ArgumentException("Search query cannot be empty.", nameof(query));
        }

        var url = $"products/search?q={Uri.EscapeDataString(query.Trim())}";

        logger.LogInformation("Calling DummyJson search products endpoint: {Url}", url);

        return await GetAsync<ProductListResponse>(url, cancellationToken)
               ?? new ProductListResponse();
    }

    private async Task<T?> GetAsync<T>(string relativeUrl, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(relativeUrl, cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                logger.LogWarning("DummyJson resource not found: {Url}", relativeUrl);
                return default;
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "DummyJson API returned status {StatusCode} for {Url}. Body: {Body}",
                    (int)response.StatusCode,
                    relativeUrl,
                    body);

                throw new HttpRequestException(
                    $"DummyJson API request failed with status {(int)response.StatusCode}. Body: {body}");
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                logger.LogWarning("DummyJson API returned empty body for {Url}", relativeUrl);
                return default;
            }

            var result = JsonSerializer.Deserialize<T>(body, JsonOptions);

            return result;
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("DummyJson API request was cancelled for {Url}", relativeUrl);
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling DummyJson API for {Url}", relativeUrl);
            throw;
        }
    }
}