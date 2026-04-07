using System.Runtime.CompilerServices;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace PolicyManagerMCP.Services;

public sealed class KernelProductChatService
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService _chatCompletionService;

    public KernelProductChatService(Kernel kernel)
    {
        _kernel = kernel;
        _chatCompletionService = _kernel.GetRequiredService<IChatCompletionService>();
    }
    public async IAsyncEnumerable<string> StreamAsync(
        ChatHistory history,
        PromptExecutionSettings settings,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var chunk in _chatCompletionService.GetStreamingChatMessageContentsAsync(
                           history,
                           settings,
                           _kernel,
                           cancellationToken))
        {
            if (string.IsNullOrEmpty(chunk.Content)) continue;
            history.AddAssistantMessage(chunk.Content); // IMPORTANT 🔥
            yield return chunk.Content;
        }
    }
    public async IAsyncEnumerable<string> AskStreamAsync(
        string prompt,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var history = new ChatHistory();

        history.AddSystemMessage("""
                                 You are a helpful shopping assistant.
                                 Use the Products plugin whenever the user asks for product details, search, sorting, or catalog data.
                                 After receiving plugin data, summarize it clearly and naturally.
                                 """);

        history.AddUserMessage(prompt);

        var settings = new PromptExecutionSettings
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
        };

        await foreach (var chunk in _chatCompletionService.GetStreamingChatMessageContentsAsync(
                           history,
                           settings,
                           _kernel,
                           cancellationToken))
        {
            if (!string.IsNullOrWhiteSpace(chunk.Content))
            {
                yield return chunk.Content!;
            }
        }
    }
}