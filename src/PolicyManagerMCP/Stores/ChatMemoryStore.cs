using Microsoft.SemanticKernel.ChatCompletion;

namespace PolicyManagerMCP.Stores;

public static class ChatMemoryStore
{
    private static readonly Dictionary<string, ChatHistory> Store = new();

    public static ChatHistory GetOrCreate(string sessionId)
    {
        if (Store.TryGetValue(sessionId, out var value)) return value;
        value = [];
        Store[sessionId] = value;

        return value;
    }
}