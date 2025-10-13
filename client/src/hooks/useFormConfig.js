import { useState, useEffect } from 'react';
import { formConfigAPI } from '../services/api';

export const useFormConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await formConfigAPI.getActive();
      setConfig(response.data.data);
    } catch (err) {
      console.error('Error loading form configuration:', err);
      setError(err.message || 'Failed to load form configuration');
      // Set to null so we can fall back to hardcoded form
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const getSectionByKey = (sectionKey) => {
    if (!config || !config.sections) return null;
    return config.sections.find(s => s.sectionKey === sectionKey);
  };

  const getVisibleSections = () => {
    if (!config || !config.sections) return [];
    return config.sections
      .filter(s => s.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getFieldByKey = (sectionKey, fieldKey) => {
    const section = getSectionByKey(sectionKey);
    if (!section || !section.fields) return null;
    return section.fields.find(f => f.fieldKey === fieldKey);
  };

  return {
    config,
    loading,
    error,
    getSectionByKey,
    getVisibleSections,
    getFieldByKey,
    reload: loadConfig
  };
};
