import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Database,
  Zap,
  Users,
  Search,
  Filter,
  BarChart3,
  CheckCircle,
  Star,
  Github,
  Twitter
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/Airtable Logo.png"
                  alt="Airtable Clone"
                  width={120}
                  height={28}
                  className="h-7 w-auto"
                />
                <span className="ml-2 text-lg font-semibold text-gray-900">Clone</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="#about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Build powerful databases
            <span className="text-blue-600 block">without complexity</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our Airtable clone combines the simplicity of a spreadsheet with the power of a database.
            Handle millions of records with lightning-fast performance and real-time collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage data
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for scale, designed for simplicity. Our platform handles the complexity so you can focus on what matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* High Performance */}
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Handle 1M+ rows with sub-100ms query times. JSONB storage and virtualized scrolling ensure smooth performance.
              </p>
            </div>

            {/* Real-time Collaboration */}
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Collaboration</h3>
              <p className="text-gray-600">
                Work together seamlessly. See changes instantly as your team edits data in real-time.
              </p>
            </div>

            {/* Advanced Filtering */}
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Filtering</h3>
              <p className="text-gray-600">
                Find exactly what you need with powerful search and filtering. 8 operators and cross-column search included.
              </p>
            </div>

            {/* JSONB Storage */}
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">JSONB Powered</h3>
              <p className="text-gray-600">
                Revolutionary JSONB storage eliminates N+1 queries and provides 90% better memory efficiency.
              </p>
            </div>

            {/* Search Everything */}
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Universal Search</h3>
              <p className="text-gray-600">
                Search across all columns and data types instantly. PostgreSQL trigram indexing for blazing fast results.
              </p>
            </div>

            {/* Views & Analytics */}
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Views</h3>
              <p className="text-gray-600">
                Create unlimited views with custom filters, sorting, and column configurations. Save and share with your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Scale
            </h2>
            <p className="text-xl text-gray-600">
              Enterprise-grade performance with modern web technologies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1M+</div>
              <div className="text-gray-600">Rows supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">&lt;100ms</div>
              <div className="text-gray-600">Query response</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">60fps</div>
              <div className="text-gray-600">Smooth scrolling</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">90%</div>
              <div className="text-gray-600">Memory savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-6">$0</div>
                <p className="text-gray-600 mb-8">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Up to 10,000 rows</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>5 workspaces</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Basic filtering</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Google OAuth</span>
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg text-center block hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-600 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-6">$29</div>
                <p className="text-gray-600 mb-8">For growing teams</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Up to 1M rows</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited workspaces</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Advanced filtering</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Custom views</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Real-time collaboration</span>
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-center block hover:bg-blue-700 transition-colors"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-gray-200 rounded-xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-6">Custom</div>
                <p className="text-gray-600 mb-8">For large organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited everything</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>On-premise deployment</span>
                </li>
              </ul>
              <Link
                href="mailto:contact@airtableclone.com"
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg text-center block hover:bg-gray-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to revolutionize your data management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who trust our platform to handle their most critical data.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Start Building Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image
                  src="/Airtable Logo.png"
                  alt="Airtable Clone"
                  width={120}
                  height={28}
                  className="h-7 w-auto filter brightness-0 invert"
                />
                <span className="ml-2 text-lg font-semibold">Clone</span>
              </div>
              <p className="text-gray-400">
                High-performance database management made simple.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <Github className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Airtable Clone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
