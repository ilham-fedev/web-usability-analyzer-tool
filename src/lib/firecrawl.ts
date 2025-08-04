import { CrawlResult, CrawlMetadata, PageData, AnalysisSettings } from "@/types";
import FirecrawlApp from '@mendable/firecrawl-js';

export class FirecrawlClient {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({
      apiKey: apiKey
    });
  }

  async scrapePage(url: string, settings?: AnalysisSettings): Promise<CrawlResult> {
    try {
      // Validate URL
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const scrapeOptions: any = {
      formats: ['markdown' as const, 'html' as const],  // Get both markdown and full HTML for comprehensive analysis
      onlyMainContent: false,  // Scrape entire page including nav, headers, footers for complete usability analysis
      maxAge: 14400000  // 4 hours cache for optimization
    };

    // Add stealth proxy if enabled in settings
    if (settings?.stealthMode) {
      scrapeOptions.proxy = 'stealth' as const;
    }

    console.log('Starting Firecrawl scrape with options:', scrapeOptions);
    console.log(`Stealth mode: ${settings?.stealthMode ? 'ENABLED' : 'DISABLED'}`);

    // Use the official SDK scrape method for single page
    const scrapeResponse = await this.app.scrapeUrl(url, scrapeOptions);

    if (!scrapeResponse.success) {
      console.error('Firecrawl scrape failed:', scrapeResponse.error);
      throw new Error(`Scraping failed: ${scrapeResponse.error}`);
    }

    return this.transformScrapeResult(scrapeResponse, url);
  }

  private transformScrapeResult(
    scrapeResponse: any,
    url: string,
  ): CrawlResult {
    console.log('Transforming scrape response:', scrapeResponse);
    
    // Handle single page data from scrape response - data is at root level
    const responseMetadata = scrapeResponse.metadata || {};
    
    // Combine both markdown and HTML content for comprehensive analysis
    const markdownContent = scrapeResponse.markdown || scrapeResponse.content || "";
    const htmlContent = scrapeResponse.html || "";
    
    // Create combined content with both formats for AI analysis
    const combinedContent = htmlContent 
      ? `HTML Content:\n${htmlContent}\n\nMarkdown Content:\n${markdownContent}`
      : markdownContent;
    
    const page: PageData = {
      url: responseMetadata.sourceURL || scrapeResponse.url || url,
      title: responseMetadata.title || scrapeResponse.title || "Untitled",
      content: combinedContent,
      metadata: {
        description: responseMetadata.description || scrapeResponse.description,
        ogTitle: responseMetadata.ogTitle || scrapeResponse.ogTitle,
        ogDescription: responseMetadata.ogDescription || scrapeResponse.ogDescription,
        keywords: responseMetadata.keywords || scrapeResponse.keywords,
        statusCode: responseMetadata.statusCode || scrapeResponse.statusCode || 200,
        htmlContent: htmlContent,  // Store raw HTML separately for advanced analysis
        markdownContent: markdownContent,  // Store markdown separately
      },
    };

    const pages: PageData[] = [page];

    const crawlMetadata: CrawlMetadata = {
      totalPages: 1,
      crawlDepth: "single-page",
      crawlTime: new Date().toISOString(),
      baseUrl: new URL(url).origin,
      fallback: false,
    };

    console.log(`Scrape completed: Single page scraped successfully`);
    console.log(`Total content length: ${page.content.length} characters`);
    console.log(`HTML content length: ${htmlContent.length} characters`);
    console.log(`Markdown content length: ${markdownContent.length} characters`);
    console.log(`Page title: ${page.title}`);
    console.log(`HTML preview: ${htmlContent.substring(0, 100)}...`);
    console.log(`Markdown preview: ${markdownContent.substring(0, 100)}...`);
    
    return { pages, metadata: crawlMetadata };
  }

  // Test API key by scraping a simple page
  async testApiKey(settings?: AnalysisSettings): Promise<boolean> {
    try {
      console.log('Testing Firecrawl API key...');
      
      const testOptions: any = {
        formats: ['markdown' as const, 'html' as const],  // Test both formats like main scrape
        onlyMainContent: false  // Use same option as main scrape method
      };

      // Add stealth proxy if enabled in settings
      if (settings?.stealthMode) {
        testOptions.proxy = 'stealth' as const;
      }
      
      const response = await this.app.scrapeUrl('https://example.com', testOptions);

      console.log('Firecrawl API test result:', response.success);
      return response.success;
    } catch (error) {
      console.error('Firecrawl API test failed:', error);
      return false;
    }
  }

  // Fallback method for when Firecrawl fails
  async fallbackScrape(url: string): Promise<CrawlResult> {
    try {
      // Create a simple mock analysis based on URL
      console.log("Using fallback scrape for:", url);

      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Generate mock content based on common website patterns
      const mockContent = `
        Website: ${domain}
        
        This is a fallback analysis for ${url}. Since we couldn't scrape the full content,
        we'll provide a basic analysis based on the URL structure and common web patterns.
        
        The website appears to be a ${this.getDomainType(domain)} website.
        Common areas we'll analyze include navigation, content structure, and basic usability principles.
        
        Note: This is a limited analysis due to scraping restrictions. For full analysis,
        please ensure your Firecrawl API key is configured correctly.
      `;

      const pages: PageData[] = [
        {
          url,
          title: `${domain} - Basic Analysis`,
          content: mockContent,
          metadata: {
            description: `Basic usability analysis for ${domain}`,
            statusCode: 200,
          },
        },
      ];

      const metadata: CrawlMetadata = {
        totalPages: 1,
        crawlDepth: "fallback",
        crawlTime: new Date().toISOString(),
        baseUrl: urlObj.origin,
        fallback: true,
      };

      return { pages, metadata };
    } catch (error) {
      throw new Error(
        "Failed to create fallback analysis: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  private getDomainType(domain: string): string {
    if (
      domain.includes("shop") ||
      domain.includes("store") ||
      domain.includes("buy")
    )
      return "e-commerce";
    if (domain.includes("blog") || domain.includes("news"))
      return "content/blog";
    if (domain.includes("app") || domain.includes("software"))
      return "application";
    if (domain.includes("edu") || domain.includes("university"))
      return "educational";
    if (domain.includes("gov")) return "government";
    return "business/general";
  }
}
