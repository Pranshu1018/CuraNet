import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';
import { seedDiseaseOutbreakData, clearDiseaseOutbreakData } from '@/lib/seed-disease-data';

const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const handleSeedData = async () => {
    setLoading(true);
    setMessage({ type: null, text: '' });
    
    try {
      const success = await seedDiseaseOutbreakData();
      if (success) {
        setMessage({ type: 'success', text: 'Sample disease outbreak data added successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to add sample data. Check console for details.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding sample data.' });
      console.error('Error seeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all disease outbreak data? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setMessage({ type: null, text: '' });
    
    try {
      const success = await clearDiseaseOutbreakData();
      if (success) {
        setMessage({ type: 'success', text: 'All disease outbreak data cleared successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to clear data. Check console for details.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error clearing data.' });
      console.error('Error clearing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="font-semibold text-sm">Demo Data Management</h4>
              <p className="text-xs text-gray-600">Add sample disease outbreak data for testing</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              disabled={loading}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              {loading ? 'Adding...' : 'Add Sample Data'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              disabled={loading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {loading ? 'Clearing...' : 'Clear Data'}
            </Button>
          </div>
        </div>
        
        {message.type && (
          <div className={`mt-3 p-2 rounded text-sm flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeedDataButton;
