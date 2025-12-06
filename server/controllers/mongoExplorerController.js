const mongoose = require('mongoose');

/**
 * MongoDB Explorer Controller
 * Provides endpoints for browsing MongoDB collections and documents
 */

// Get list of all collections with document counts
const getCollections = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Get document count for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const count = await db.collection(collection.name).countDocuments();

        // Use collStats command instead of deprecated stats() method
        let stats = { size: 0, nindexes: 0, avgObjSize: 0 };
        try {
          const result = await db.command({ collStats: collection.name });
          stats = {
            size: result.size || 0,
            nindexes: result.nindexes || 0,
            avgObjSize: result.avgObjSize || 0
          };
        } catch (err) {
          console.warn(`Failed to get stats for collection ${collection.name}:`, err.message);
        }

        return {
          name: collection.name,
          type: collection.type,
          documentCount: count,
          sizeBytes: stats.size,
          indexCount: stats.nindexes,
          avgObjSize: stats.avgObjSize
        };
      })
    );

    // Sort by name
    collectionsWithCounts.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      collections: collectionsWithCounts,
      totalCollections: collectionsWithCounts.length
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: error.message
    });
  }
};

// Get documents from a specific collection
const getDocuments = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { page = 1, limit = 20, sort = '_id', order = 'desc' } = req.query;

    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await collection.countDocuments();

    // Get documents (with projection to limit initial data size)
    const documents = await collection
      .find({})
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      collection: collectionName,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
};

// Get a specific document by ID with full nested data
const getDocumentById = async (req, res) => {
  try {
    const { collectionName, documentId } = req.params;

    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    // Try to convert to ObjectId if it looks like one
    let query;
    if (mongoose.Types.ObjectId.isValid(documentId) && documentId.length === 24) {
      query = { _id: new mongoose.Types.ObjectId(documentId) };
    } else {
      query = { _id: documentId };
    }

    const document = await collection.findOne(query);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      collection: collectionName,
      document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message
    });
  }
};

// Get collection schema/structure (inferred from sample documents)
const getCollectionSchema = async (req, res) => {
  try {
    const { collectionName } = req.params;

    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    // Get a few sample documents to infer schema
    const samples = await collection.find({}).limit(10).toArray();

    if (samples.length === 0) {
      return res.json({
        success: true,
        collection: collectionName,
        schema: {},
        fieldCount: 0
      });
    }

    // Infer schema from samples
    const schema = {};

    const inferType = (value) => {
      if (value === null) return 'null';
      if (Array.isArray(value)) {
        if (value.length === 0) return 'Array (empty)';
        return `Array of ${inferType(value[0])}`;
      }
      if (value instanceof Date) return 'Date';
      if (mongoose.Types.ObjectId.isValid(value)) return 'ObjectId';
      if (typeof value === 'object') return 'Object';
      return typeof value;
    };

    const extractFields = (obj, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (!schema[fullKey]) {
          schema[fullKey] = {
            type: inferType(value),
            count: 0,
            nullable: false
          };
        }

        schema[fullKey].count++;

        if (value === null || value === undefined) {
          schema[fullKey].nullable = true;
        }

        // Don't recurse too deep
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && prefix.split('.').length < 2) {
          extractFields(value, fullKey);
        }
      });
    };

    samples.forEach(doc => extractFields(doc));

    res.json({
      success: true,
      collection: collectionName,
      schema,
      fieldCount: Object.keys(schema).length,
      sampleSize: samples.length
    });
  } catch (error) {
    console.error('Error fetching collection schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collection schema',
      error: error.message
    });
  }
};

// Search documents in a collection
const searchDocuments = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { query = '', field = '', limit = 20 } = req.query;

    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    let searchQuery = {};

    if (query && field) {
      // Search specific field
      searchQuery[field] = { $regex: query, $options: 'i' };
    } else if (query) {
      // Text search across all string fields (if text index exists)
      searchQuery = { $text: { $search: query } };
    }

    const documents = await collection
      .find(searchQuery)
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      collection: collectionName,
      documents,
      count: documents.length,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents',
      error: error.message
    });
  }
};

module.exports = {
  getCollections,
  getDocuments,
  getDocumentById,
  getCollectionSchema,
  searchDocuments
};
