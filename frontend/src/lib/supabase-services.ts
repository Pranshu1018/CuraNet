import { supabase } from './supabase.js';

// Real Supabase services for advanced features
export const supabaseServices = {
  // Ambulance Detection
  ambulance: {
    getEvents: async () => {
      const { data, error } = await supabase
        .from('ambulance_events')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching ambulance events:', error);
        return [];
      }
      
      return data || [];
    },
    
    listenToEvents: (callback: (data: any) => void) => {
      const channel = supabase
        .channel('ambulance_events')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ambulance_events'
          },
          (payload) => {
            callback(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  },

  // Disease Outbreak Detection
  disease: {
    getOutbreaks: async () => {
      const { data, error } = await supabase
        .from('disease_outbreaks')
        .select('*')
        .order('latest_detection', { ascending: false });
      
      if (error) {
        console.error('Error fetching disease outbreaks:', error);
        return [];
      }
      
      return data || [];
    },
    
    listenToOutbreaks: (callback: (data: any) => void) => {
      const channel = supabase
        .channel('disease_outbreaks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'disease_outbreaks'
          },
          (payload) => {
            callback(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  },

  // Resource Decay Prediction
  resource: {
    getUsage: async () => {
      const { data, error } = await supabase
        .from('resource_usage')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) {
        console.error('Error fetching resource usage:', error);
        return [];
      }
      
      return data || [];
    },
    
    listenToUsage: (callback: (data: any) => void) => {
      const channel = supabase
        .channel('resource_usage')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'resource_usage'
          },
          (payload) => {
            callback(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }
};
