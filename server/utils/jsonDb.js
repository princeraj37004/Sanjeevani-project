const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Helper to ensure data directory exists
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

class Model {
  constructor(name) {
    this.name = name.toLowerCase() + 's'; // e.g. "users", "activities"
    this.filePath = path.join(DATA_DIR, `${this.name}.json`);
  }

  async _read() {
    await ensureDir();
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // If file doesn't exist, initialize with empty array
        await this._write([]);
        return [];
      }
      throw err;
    }
  }

  async _write(data) {
    await ensureDir();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async find(query = {}) {
    const items = await this._read();
    return items.filter(item => {
      for (const key in query) {
        // Check if query value is an object (like $gt, $lt, $in)
        if (query[key] && typeof query[key] === 'object') {
          const qVal = query[key];
          const itemVal = item[key];
          
          if ('$in' in qVal && Array.isArray(qVal.$in)) {
            if (!qVal.$in.includes(itemVal)) return false;
          } else if ('$nin' in qVal && Array.isArray(qVal.$nin)) {
            if (qVal.$nin.includes(itemVal)) return false;
          } else if ('$gte' in qVal) {
            if (itemVal < qVal.$gte) return false;
          } else if ('$lte' in qVal) {
            if (itemVal > qVal.$lte) return false;
          } else if ('$gt' in qVal) {
            if (itemVal <= qVal.$gt) return false;
          } else if ('$lt' in qVal) {
            if (itemVal >= qVal.$lt) return false;
          }
        } else {
          // Normal equality check
          if (item[key] !== query[key]) return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    const items = await this._read();
    return items.find(item => item._id === id) || null;
  }

  async create(data) {
    const items = await this._read();
    const newDoc = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newDoc);
    await this._write(items);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const items = await this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    const updatedDoc = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    items[index] = updatedDoc;
    await this._write(items);
    return updatedDoc;
  }

  async findByIdAndDelete(id) {
    const items = await this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    const deletedItem = items[index];
    const filtered = items.filter(item => item._id !== id);
    await this._write(filtered);
    return deletedItem;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

module.exports = {
  model: (name) => new Model(name)
};
