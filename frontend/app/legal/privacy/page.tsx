export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-slate-400 mb-8">
          <em>Last updated: January 2024</em>
        </p>

        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="mb-6">
            Riskr ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our trading analytics platform.
          </p>

          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-medium mb-3">Personal Information</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Account information (name, email, username)</li>
            <li>Trading data you import or enter</li>
            <li>Usage analytics and preferences</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Technical Information</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>IP addresses and device information</li>
            <li>Browser type and version</li>
            <li>Usage patterns and interactions</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Provide and maintain our services</li>
            <li>Process transactions and manage your account</li>
            <li>Improve our platform and user experience</li>
            <li>Send important updates and notifications</li>
            <li>Ensure security and prevent fraud</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="mb-4">We implement industry-standard security measures to protect your data:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Encryption at rest and in transit</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Secure data centers</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or rent your personal information to third parties. We may share data only in these limited circumstances:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>With service providers under strict confidentiality agreements</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Export your trading data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Email: privacy@riskr.net</li>
            <li>Support: support@riskr.net</li>
          </ul>

          <hr className="border-slate-700 my-8" />
          
          <p className="text-slate-500 text-sm">
            <em>This is a placeholder privacy policy. Please consult with legal counsel before using in production.</em>
          </p>
        </div>
      </div>
    </div>
  )
}
