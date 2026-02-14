import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function AdminFixPage() {
  const { user } = useAuthStore();
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Only allow specific admin users
  const ADMIN_USERS = ['1Malqb8csrZ0Sy38lV0S0Sv3Adi2'];
  const ADMIN_EMAILS = ['tadeas@raska.eu', 'admin@naklikam.cz'];
  const isAdmin = user && (ADMIN_USERS.includes(user.id) || ADMIN_EMAILS.includes(user.email));

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            <span>Přístup odepřen</span>
          </div>
        </Card>
      </div>
    );
  }

  const handleFix = async () => {
    setIsFixing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling manual fix endpoint...');
      let response = await fetch('/api/admin/manual-fix-stripe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          adminUserId: user.id,
          adminEmail: user.email 
        })
      });

      console.log('Response status:', response.status);
      
      // Fallback to original endpoint if manual fix fails
      if (!response.ok) {
        console.log('Manual fix failed, trying original endpoint...');
        response = await fetch('/api/admin/fix-stripe-customers', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            adminUserId: user.id,
            adminEmail: user.email 
          })
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Full error:', err);
      setError(err.message);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-6">🔧 Admin: Oprava Stripe Customer IDs</h1>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Varování:</strong> Tato akce opraví duplicitní Stripe Customer IDs v databázi.
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Bude provádět:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  <li>Načtení všech Stripe customerů</li>
                  <li>Identifikaci duplicit</li>
                  <li>Opravu stripeCustomerId v Firebase</li>
                  <li>Preferenci customerů s aktivním předplatným</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleFix}
            disabled={isFixing}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Opravuji databázi...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Spustit opravu Stripe Customer IDs
              </>
            )}
          </Button>

          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Chyba:</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="w-full">
                    <p className="font-semibold text-green-800 dark:text-green-200">Oprava dokončena!</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-green-700 dark:text-green-300">Stripe customerů:</span>
                        <span className="ml-2 font-mono">{result.summary?.totalStripeCustomers || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-700 dark:text-green-300">Firebase uživatelů:</span>
                        <span className="ml-2 font-mono">{result.summary?.totalFirebaseUsers || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-700 dark:text-green-300">✅ Správných:</span>
                        <span className="ml-2 font-mono">{result.summary?.correct || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-700 dark:text-green-300">🔧 Opraveno:</span>
                        <span className="ml-2 font-mono font-bold">{result.summary?.fixed || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-700 dark:text-green-300">⚠️ Chybí:</span>
                        <span className="ml-2 font-mono">{result.summary?.missing || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-700 dark:text-green-300">🔴 Duplicit:</span>
                        <span className="ml-2 font-mono">{result.summary?.duplicates || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {result.fixedUsers && result.fixedUsers.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Opravení uživatelé:</h3>
                  <div className="space-y-1 text-xs font-mono">
                    {result.fixedUsers.map((fix: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>User: {fix.userId}</div>
                        <div className="text-red-500">Old: {fix.old}</div>
                        <div className="text-green-500">New: {fix.new}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.duplicateUsers && result.duplicateUsers.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Uživatelé s duplicitami:</h3>
                  <div className="space-y-1 text-xs">
                    {result.duplicateUsers.map((dup: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="font-mono">User: {dup.userId}</div>
                        <div className="text-gray-600">Customers: {dup.customerIds.join(', ')}</div>
                        {dup.activeCustomer && (
                          <div className="text-green-600">✅ Active: {dup.activeCustomer}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}