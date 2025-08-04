# Web Usability Analyzer Tool

A comprehensive web usability analysis tool powered by AI that evaluates websites based on Steve Krug's "Don't Make Me Think" principles. This tool combines web scraping capabilities with advanced AI analysis to provide actionable usability insights and recommendations.

## ✨ Features

### 🔍 **Comprehensive Website Analysis**
- **AI-Powered Analysis**: Supports Claude (Anthropic) and OpenAI GPT-4 for intelligent usability evaluation
- **Steve Krug's Principles**: Analysis based on proven usability principles from "Don't Make Me Think"
- **Multi-Depth Analysis**: Choose between Quick, Standard, or Deep analysis modes
- **Mobile Responsiveness**: Optional mobile usability analysis and touch interaction evaluation

### 🕷️ **Advanced Web Scraping**
- **Firecrawl Integration**: Uses official Firecrawl SDK for reliable web content extraction
- **Stealth Mode**: Optional stealth proxy for better scraping success rates
- **Complete Page Analysis**: Scrapes entire page including navigation, headers, footers for comprehensive analysis
- **Fallback System**: Automatic fallback when scraping fails

### 📊 **Detailed Reporting**
- **Usability Categories**: Navigation clarity, content hierarchy, forms, accessibility, and more
- **Priority-Based Issues**: Issues categorized as high, medium, or low priority
- **Actionable Recommendations**: Specific improvement suggestions with implementation guidance
- **Multiple Export Formats**: Export results as PDF, Markdown, or CSV
- **Visual Scoring**: Overall usability score with category breakdowns

### ⚙️ **User-Friendly Configuration**
- **Settings Management**: Easy-to-use settings modal with API key management
- **API Key Testing**: Built-in testing for Firecrawl and AI API keys
- **Progress Tracking**: Real-time analysis progress with detailed steps
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for:
  - [Firecrawl](https://firecrawl.dev) (for web scraping)
  - [Anthropic Claude](https://console.anthropic.com) or [OpenAI](https://platform.openai.com) (for AI analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ilham-fedev/web-usability-analyzer-tool.git
   cd web-usability-analyzer-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys (or configure them in the app settings):
   ```
   FIRECRAWL_API_KEY=your_firecrawl_key_here
   ANTHROPIC_API_KEY=your_claude_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Configuration

### API Keys Setup

1. **Open Settings**: Click the gear icon on the homepage
2. **Configure API Keys**:
   - **Firecrawl API Key**: Get yours from [firecrawl.dev](https://firecrawl.dev)
   - **AI Provider**: Choose between Claude or OpenAI
   - **AI API Key**: Get from [Anthropic](https://console.anthropic.com) or [OpenAI](https://platform.openai.com)
3. **Test Connections**: Use the test buttons to verify your API keys
4. **Save Settings**: Your settings are stored locally in your browser

### Analysis Settings

- **AI Provider**: Choose between Claude (Anthropic) or OpenAI GPT-4
- **Analysis Depth**:
  - **Quick**: Basic issues analysis (~1-2 mins)
  - **Standard**: Comprehensive analysis (~2-3 mins)
  - **Deep**: Exhaustive analysis with detailed insights (~3-5 mins)
- **Mobile Analysis**: Enable to include mobile responsiveness evaluation
- **Stealth Mode**: Enable stealth proxy for better scraping success rates

## 📖 Usage

1. **Enter Website URL**: Input the website URL you want to analyze
2. **Configure Settings**: Adjust analysis preferences in settings
3. **Start Analysis**: Click "Analyze Website" to begin the process
4. **Monitor Progress**: Watch real-time progress through 4 stages:
   - URL Validation
   - Website Scraping
   - AI Analysis
   - Report Generation
5. **Review Results**: Examine the detailed usability report
6. **Export Results**: Download findings in PDF, Markdown, or CSV format

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── analysis/          # Analysis progress page
│   │   ├── api/               # API routes
│   │   │   ├── ai-analyze/    # AI analysis endpoint
│   │   │   ├── test-claude/   # Claude API testing
│   │   │   ├── test-firecrawl/# Firecrawl API testing
│   │   │   └── test-openai/   # OpenAI API testing
│   │   ├── results/           # Results display page
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   └── SettingsModal.tsx  # Settings configuration modal
│   ├── lib/                   # Utility libraries
│   │   ├── ai-analysis.ts     # AI analysis logic
│   │   ├── export.ts          # Export functionality
│   │   └── firecrawl.ts       # Firecrawl integration
│   └── types/                 # TypeScript type definitions
│       └── index.ts           # Shared interfaces and types
├── public/                    # Static assets
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🧠 Analysis Categories

The tool evaluates websites across 9 key usability categories based on Steve Krug's principles:

1. **Navigation Clarity** (20% weight) - Persistent navigation, "you are here" indicators
2. **Content Hierarchy** (18% weight) - Visual hierarchy, scannable text
3. **Page Names & Breadcrumbs** (15% weight) - Clear page identification
4. **Search Functionality** (12% weight) - Obvious search placement and effectiveness
5. **Forms & User Input** (10% weight) - User-friendly forms and validation
6. **Mobile Usability** (10% weight) - Touch interactions and responsive design
7. **Page Loading & Performance** (8% weight) - Fast loading and optimization
8. **Accessibility** (5% weight) - Universal usability features
9. **Error Handling** (2% weight) - Clear error messages and recovery paths

## 🔧 Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **AI Integration**: Anthropic Claude API, OpenAI API
- **Web Scraping**: Firecrawl SDK with stealth mode support
- **Export**: jsPDF for PDF generation, custom Markdown/CSV exporters
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom components

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Steve Krug** - For the foundational usability principles from "Don't Make Me Think"
- **Firecrawl** - For reliable web scraping capabilities
- **Anthropic & OpenAI** - For powerful AI analysis capabilities
- **Next.js Team** - For the excellent React framework

## 🚨 Disclaimer

This tool is designed for legitimate website analysis purposes. Always ensure you have permission to analyze websites and comply with their terms of service and robots.txt files.

---

**Built with ❤️ by Muhammad Ilham**

For support or questions, please open an issue on GitHub.