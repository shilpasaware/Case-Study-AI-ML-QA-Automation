export class AIValidator {
    constructor() {
        this.commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to'];
    }

    /**
     * Calculate simple word-based similarity between two texts
     * For production, integrate with DeepEval or use OpenAI embeddings
     */
    calculateSimpleSimilarity(text1, text2) {
        const words1 = this.tokenize(text1.toLowerCase());
        const words2 = this.tokenize(text2.toLowerCase());
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    tokenize(text) {
        return text
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.commonWords.includes(word));
    }

    /**
     * Check if response contains hallucination indicators
     */
    checkHallucinationIndicators(response) {
        const indicators = [
            'I am not sure',
            'I do not have',
            'I cannot confirm',
            'This might be',
            'Possibly',
            'I think',
            'Maybe'
        ];
        
        return indicators.some(indicator => 
            response.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    /**
     * Validate response quality metrics
     */
    validateResponseQuality(response, minLength = 50, maxLength = 1000) {
        return {
            hasContent: response.trim().length > 0,
            meetsMinLength: response.length >= minLength,
            withinMaxLength: response.length <= maxLength,
            notTooShort: response.split(' ').length >= 10,
            noRepeatedPhrases: !this.hasExcessiveRepetition(response)
        };
    }

    hasExcessiveRepetition(text) {
        const sentences = text.split(/[.!?]+/);
        const uniqueSentences = new Set(sentences.map(s => s.trim()));
        
        // If more than 30% repetition, flag it
        return uniqueSentences.size / sentences.length < 0.7;
    }

    /**
     * Check if response is contextually relevant to query
     */
    checkRelevance(query, response, keywords = []) {
        const queryWords = this.tokenize(query.toLowerCase());
        const responseWords = this.tokenize(response.toLowerCase());
        
        // Check keyword overlap
        const overlap = queryWords.filter(word => responseWords.includes(word));
        const relevanceScore = overlap.length / queryWords.length;
        
        // Check for provided keywords
        const hasKeywords = keywords.length === 0 || keywords.some(keyword => 
            response.toLowerCase().includes(keyword.toLowerCase())
        );
        
        return {
            relevanceScore,
            hasKeywords,
            isRelevant: relevanceScore > 0.2 || hasKeywords
        };
    }
}