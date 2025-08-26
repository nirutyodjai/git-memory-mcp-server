import Head from 'next/head'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Head>
        <title>Git Memory MCP Server - AI-Enhanced Git with Memory Intelligence</title>
        <meta
          name="description"
          content="Transform your Git workflow with AI-powered memory system. Get intelligent code suggestions, semantic search, and context-aware development assistance."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Git Memory MCP Server - AI-Enhanced Git with Memory Intelligence" />
        <meta
          property="og:description"
          content="Transform your Git workflow with AI-powered memory system. Get intelligent code suggestions, semantic search, and context-aware development assistance."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://git-memory.dev" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Git Memory MCP Server - AI-Enhanced Git with Memory Intelligence" />
        <meta
          name="twitter:description"
          content="Transform your Git workflow with AI-powered memory system. Get intelligent code suggestions, semantic search, and context-aware development assistance."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://git-memory.dev" />
      </Head>
      
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Hero />
          <Features />
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  )
}