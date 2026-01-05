import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTabTitle } from '@/hooks/useTabTitle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const PrivacyPage = () => {
  useTabTitle('Privacy Policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Self-Hosted Application:</strong> This is a self-hosted media library application. All data is stored locally on your own server or device. The application developers do not collect, store, or have access to any of your personal data.
            </AlertDescription>
          </Alert>

          <section>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="text-muted-foreground">
              This application is designed to run on your own infrastructure (personal computer, server, NAS, Docker container, etc.). You maintain complete ownership and control of all data stored within the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                All information you enter into this application is stored locally in your database and on your file system. This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>User accounts and authentication credentials</li>
                <li>Media information (titles, descriptions, metadata)</li>
                <li>Uploaded images and cover art</li>
                <li>Custom collections and organization data</li>
                <li>Application settings and preferences</li>
              </ul>
              <p className="mt-3">
                <strong>Important:</strong> The application developers have no access to this data. Data security and privacy are entirely your responsibility as the system administrator.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party API Usage</h2>
            <p className="text-muted-foreground mb-3">
              The application includes optional features that query external APIs from your server:
            </p>
            <div className="space-y-4 text-muted-foreground">
              <div className="border-l-2 border-muted pl-4">
                <h3 className="font-medium text-foreground mb-1">TheTVDB</h3>
                <p className="mb-2">
                  When you use the "Import from TheTVDB" feature, the application makes API requests to TheTVDB on your behalf. These requests originate from your server's IP address, not from the application developers.
                </p>
                <p>
                  Please review{' '}
                  <a 
                    href="https://thetvdb.com/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    TheTVDB's Privacy Policy
                  </a>{' '}
                  to understand how they handle API requests.
                </p>
              </div>

              <div className="border-l-2 border-muted pl-4">
                <h3 className="font-medium text-foreground mb-1">AniList</h3>
                <p className="mb-2">
                  When you use the "Import from AniList" feature, the application makes API requests to AniList on your behalf. These requests originate from your server's IP address, not from the application developers.
                </p>
                <p>
                  Please review{' '}
                  <a 
                    href="https://anilist.co/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    AniList's Terms of Service
                  </a>{' '}
                  and{' '}
                  <a 
                    href="https://anilist.co/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Privacy Policy
                  </a>{' '}
                  to understand how they handle API requests.
                </p>
              </div>

              <div className="border-l-2 border-muted pl-4">
                <h3 className="font-medium text-foreground mb-1">Open Library</h3>
                <p className="mb-2">
                  When you use the "Import from OpenLibrary" feature, the application makes API requests to Open Library (operated by the Internet Archive) on your behalf. These requests originate from your server's IP address, not from the application developers.
                </p>
                <p>
                  Please review{' '}
                  <a 
                    href="https://openlibrary.org/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Open Library's Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a 
                    href="https://archive.org/about/terms.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Internet Archive's Terms of Use
                  </a>{' '}
                  to understand how they handle API requests.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">No Telemetry or Analytics</h2>
            <p className="text-muted-foreground">
              This application does not collect usage statistics, analytics, crash reports, or any other telemetry data. The application developers have no visibility into how you use the software or what data you store.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Public Hosting Considerations</h2>
            <p className="text-muted-foreground mb-3">
              If you choose to make your instance publicly accessible or allow other users to access it:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>You become responsible for the privacy and security of your users' data</li>
              <li>You should implement appropriate security measures (HTTPS, strong passwords, etc.)</li>
              <li>You may need to create your own privacy policy that reflects your specific hosting practices</li>
              <li>You are responsible for complying with applicable data protection laws (GDPR, CCPA, etc.)</li>
              <li>Consider the privacy implications of any third-party APIs you enable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your Responsibilities</h2>
            <p className="text-muted-foreground mb-3">
              As the administrator of your self-hosted instance, you are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Securing your server and database</li>
              <li>Backing up your data regularly</li>
              <li>Managing user accounts and access controls</li>
              <li>Keeping the application updated with security patches</li>
              <li>Protecting API keys and credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Open Source</h2>
            <p className="text-muted-foreground mb-2">
              This application is open-source software released under the MIT License. You can review the source code to verify that no data is collected or transmitted to external servers (except when you explicitly use third-party API features).
            </p>
            <p className="text-muted-foreground">
              As stated in the MIT License, the software is provided "as-is" without warranty of any kind. You are free to modify, distribute, and use the software as permitted by the license terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Questions or Concerns</h2>
            <p className="text-muted-foreground">
              If you have questions about how this application handles data, please review the documentation or source code. For security vulnerabilities, please report them through the project's issue tracker or contact the maintainers directly.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;