import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTabTitle } from '@/hooks/useTabTitle';
import { useEffect } from 'react';

const ApisPage = () => {
  useTabTitle('API Usage');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Third-Party APIs</CardTitle>
          <CardDescription>
            This application uses the following external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">TheTVDB</h3>
            <p className="text-sm text-muted-foreground mb-2">
              TV and movie metadata import functionality is powered by{' '}
              <a 
                href="https://thetvdb.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                TheTVDB.com
              </a>
              . We are not endorsed or certified by TheTVDB.com or its affiliates.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Open Library</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Book metadata import functionality is powered by{' '}
              <a 
                href="https://openlibrary.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Open Library
              </a>
              , an open, editable library catalog by the Internet Archive. We are not endorsed or certified by Open Library or the Internet Archive.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApisPage;