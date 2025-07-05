import Fuse from 'fuse.js'
import { Product } from '../types'

export interface FuzzySearchResult {
  product: Product
  score: number
  matches?: Fuse.FuseResultMatch[]
}

export class ProductFuzzySearch {
  private fuse: Fuse<Product>
  private products: Product[]

  constructor(products: Product[]) {
    this.products = products
    
    // Configure Fuse.js options for optimal product matching
    const options: Fuse.IFuseOptions<Product> = {
      // Fields to search in, with weights
      keys: [
        { name: 'name', weight: 0.8 },           // Primary field - product name
        { name: 'description', weight: 0.2 },    // Secondary field - description
      ],
      
      // Search configuration
      threshold: 0.4,           // Lower = more strict (0.0 = perfect match, 1.0 = match anything)
      distance: 100,            // Maximum distance for fuzzy matching
      minMatchCharLength: 2,    // Minimum character length to trigger a match
      
      // Result configuration
      includeScore: true,       // Include match score in results
      includeMatches: true,     // Include match details for debugging
      
      // Advanced options
      ignoreLocation: true,     // Don't consider location of match in string
      findAllMatches: true,     // Find all matches, not just the first
      
      // Use extended search for better pattern matching
      useExtendedSearch: false,
    }

    this.fuse = new Fuse(products, options)
  }

  /**
   * Search for products using fuzzy matching
   */
  search(query: string, limit: number = 5): FuzzySearchResult[] {
    if (!query || query.trim().length < 2) {
      return []
    }

    const results = this.fuse.search(query.trim(), { limit })
    
    return results.map(result => ({
      product: result.item,
      score: result.score || 0,
      matches: result.matches
    }))
  }

  /**
   * Find the best matching product for a given query
   */
  findBestMatch(query: string): FuzzySearchResult | null {
    const results = this.search(query, 1)
    return results.length > 0 ? results[0] : null
  }

  /**
   * Enhanced product matching with multiple strategies
   */
  findProduct(searchName: string): {
    product: Product | null
    confidence: 'exact' | 'high' | 'medium' | 'low' | 'none'
    alternatives: Product[]
    matchType: string
  } {
    if (!searchName || !searchName.trim()) {
      return {
        product: null,
        confidence: 'none',
        alternatives: [],
        matchType: 'empty_query'
      }
    }

    const normalizedSearch = searchName.toLowerCase().trim()
    
    // Strategy 1: Exact match (highest confidence)
    const exactMatch = this.products.find(p => 
      p.name.toLowerCase() === normalizedSearch
    )
    
    if (exactMatch) {
      return {
        product: exactMatch,
        confidence: 'exact',
        alternatives: [],
        matchType: 'exact_match'
      }
    }

    // Strategy 2: Exact match with singular/plural handling
    const singularSearch = normalizedSearch.endsWith('s') ? normalizedSearch.slice(0, -1) : normalizedSearch
    const pluralSearch = normalizedSearch.endsWith('s') ? normalizedSearch : normalizedSearch + 's'
    
    const pluralMatch = this.products.find(p => {
      const productName = p.name.toLowerCase()
      return productName === singularSearch || productName === pluralSearch
    })
    
    if (pluralMatch) {
      return {
        product: pluralMatch,
        confidence: 'exact',
        alternatives: [],
        matchType: 'singular_plural_match'
      }
    }

    // Strategy 3: Clean search (remove common prefixes/suffixes)
    const cleanedSearch = normalizedSearch
      .replace(/^(fresh|organic|premium|quality|best|top|local|farm)\s+/i, '')
      .replace(/\s+(fruit|vegetable|item|product|food)$/i, '')
      .trim()
    
    if (cleanedSearch !== normalizedSearch && cleanedSearch.length >= 2) {
      const cleanMatch = this.products.find(p => 
        p.name.toLowerCase() === cleanedSearch ||
        p.name.toLowerCase() === (cleanedSearch.endsWith('s') ? cleanedSearch.slice(0, -1) : cleanedSearch + 's')
      )
      
      if (cleanMatch) {
        return {
          product: cleanMatch,
          confidence: 'high',
          alternatives: [],
          matchType: 'cleaned_exact_match'
        }
      }
    }

    // Strategy 4: Fuzzy search with Fuse.js
    const fuzzyResults = this.search(normalizedSearch, 5)
    
    if (fuzzyResults.length > 0) {
      const bestMatch = fuzzyResults[0]
      
      // Determine confidence based on score
      let confidence: 'high' | 'medium' | 'low'
      if (bestMatch.score <= 0.1) {
        confidence = 'high'
      } else if (bestMatch.score <= 0.3) {
        confidence = 'medium'
      } else {
        confidence = 'low'
      }

      // Get alternatives (other good matches)
      const alternatives = fuzzyResults
        .slice(1, 4)
        .filter(result => result.score <= 0.5)
        .map(result => result.product)

      return {
        product: bestMatch.product,
        confidence,
        alternatives,
        matchType: `fuzzy_match_score_${bestMatch.score.toFixed(3)}`
      }
    }

    // Strategy 5: Partial word matching as last resort
    const partialMatches = this.products.filter(p => {
      const productName = p.name.toLowerCase()
      const searchWords = normalizedSearch.split(' ')
      
      return searchWords.some(word => 
        word.length >= 3 && (
          productName.includes(word) || 
          word.includes(productName) ||
          productName.split(' ').some(productWord => 
            productWord.startsWith(word.slice(0, 3)) ||
            word.startsWith(productWord.slice(0, 3))
          )
        )
      )
    })

    if (partialMatches.length > 0) {
      return {
        product: partialMatches[0],
        confidence: 'low',
        alternatives: partialMatches.slice(1, 4),
        matchType: 'partial_word_match'
      }
    }

    // No match found
    return {
      product: null,
      confidence: 'none',
      alternatives: this.getSuggestions(normalizedSearch),
      matchType: 'no_match'
    }
  }

  /**
   * Get product suggestions for failed searches
   */
  private getSuggestions(searchName: string, limit: number = 3): Product[] {
    const firstWord = searchName.split(' ')[0]
    if (firstWord.length < 2) return []
    
    // Use fuzzy search for suggestions
    const suggestions = this.search(firstWord, limit * 2)
    
    // Also include products that start with similar letters
    const letterSuggestions = this.products.filter(p => {
      const productName = p.name.toLowerCase()
      return productName.startsWith(firstWord.slice(0, 2)) ||
             productName.split(' ').some(word => word.startsWith(firstWord.slice(0, 2)))
    })

    // Combine and deduplicate
    const allSuggestions = [
      ...suggestions.map(s => s.product),
      ...letterSuggestions
    ]

    const uniqueSuggestions = allSuggestions.filter((product, index, array) => 
      array.findIndex(p => p.id === product.id) === index
    )

    return uniqueSuggestions.slice(0, limit)
  }

  /**
   * Update the product list and reinitialize Fuse
   */
  updateProducts(products: Product[]) {
    this.products = products
    this.fuse.setCollection(products)
  }

  /**
   * Get search statistics for debugging
   */
  getSearchStats(query: string) {
    const results = this.search(query, 10)
    return {
      query,
      totalResults: results.length,
      bestScore: results.length > 0 ? results[0].score : null,
      averageScore: results.length > 0 
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
        : null,
      results: results.map(r => ({
        name: r.product.name,
        score: r.score,
        matches: r.matches?.map(m => ({
          key: m.key,
          value: m.value,
          indices: m.indices
        }))
      }))
    }
  }
}