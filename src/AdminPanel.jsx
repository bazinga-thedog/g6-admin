import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './AdminPanel.css'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('cities')
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Data states
  const [cities, setCities] = useState([])
  const [neighborhoods, setNeighborhoods] = useState([])
  const [qualityOfLife, setQualityOfLife] = useState([])

  // UI states
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Simple password protection (replace with proper auth in production)
  const ADMIN_PASSWORD = 'admin123' // Change this!

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setMessage({ type: 'success', text: 'Logged in successfully!' })
    } else {
      setMessage({ type: 'error', text: 'Invalid password' })
    }
  }

  // Fetch all data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [citiesData, neighborhoodsData, qolData] = await Promise.all([
        supabase.from('investment_locations').select('*').order('city'),
        supabase.from('neighborhoods').select('*').order('city_name, name'),
        supabase.from('neighborhood_quality_of_life').select('*').order('city_name, neighborhood_name')
      ])

      if (citiesData.error) throw citiesData.error
      if (neighborhoodsData.error) throw neighborhoodsData.error
      if (qolData.error) throw qolData.error

      setCities(citiesData.data)
      setNeighborhoods(neighborhoodsData.data)
      setQualityOfLife(qolData.data)
    } catch (error) {
      setMessage({ type: 'error', text: `Error loading data: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  // CRUD Operations
  const handleSave = async (table, data, isNew = false) => {
    try {
      setLoading(true)
      console.log('Saving to table:', table, 'Data:', data, 'isNew:', isNew)

      if (isNew) {
        const { data: result, error, status, statusText } = await supabase.from(table).insert([data]).select()
        console.log('Insert result:', result, 'Error:', error, 'Status:', status, statusText)
        if (error) throw error
        if (!result || result.length === 0) {
          throw new Error('Insert succeeded but returned no data. Check RLS policies!')
        }
        setMessage({ type: 'success', text: 'Created successfully!' })
      } else {
        const { data: result, error, count, status, statusText } = await supabase.from(table).update(data).eq('id', data.id).select()
        console.log('Update result:', result, 'Error:', error, 'Count:', count, 'Status:', status, statusText)
        if (error) throw error
        if (!result || result.length === 0) {
          throw new Error('Update succeeded but affected 0 rows. Check RLS policies or verify the ID exists!')
        }
        setMessage({ type: 'success', text: 'Updated successfully!' })
      }

      await fetchData()
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: `Error saving: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (table, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      setLoading(true)
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error

      setMessage({ type: 'success', text: 'Deleted successfully!' })
      await fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: `Error deleting: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }


  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>G6 Intelligence - Admin Panel</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <button type="submit" className="login-btn">Login</button>
          </form>
          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
        </div>
      </div>
    )
  }


  return (
    <div className="admin-panel">
      {/* Header */}
      <header className="admin-header">
        <h1>G6 Intelligence - Admin Panel</h1>
        <button onClick={() => setIsAuthenticated(false)} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Message Banner */}
      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={activeTab === 'cities' ? 'active' : ''}
          onClick={() => setActiveTab('cities')}
        >
          Investment Locations ({cities.length})
        </button>
        <button
          className={activeTab === 'neighborhoods' ? 'active' : ''}
          onClick={() => setActiveTab('neighborhoods')}
        >
          Neighborhoods ({neighborhoods.length})
        </button>
        <button
          className={activeTab === 'qol' ? 'active' : ''}
          onClick={() => setActiveTab('qol')}
        >
          Quality of Life ({qualityOfLife.length})
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {loading && <div className="loading-overlay">Loading...</div>}

        {activeTab === 'cities' && (
          <CitiesTab
            cities={cities}
            onEdit={(city) => { setEditingItem(city); setShowModal(true); }}
            onDelete={(id) => handleDelete('investment_locations', id)}
            onNew={() => { setEditingItem({}); setShowModal(true); }}
          />
        )}

        {activeTab === 'neighborhoods' && (
          <NeighborhoodsTab
            neighborhoods={neighborhoods}
            onEdit={(n) => { setEditingItem(n); setShowModal(true); }}
            onDelete={(id) => handleDelete('neighborhoods', id)}
            onNew={() => { setEditingItem({}); setShowModal(true); }}
          />
        )}

        {activeTab === 'qol' && (
          <QualityOfLifeTab
            qualityOfLife={qualityOfLife}
            onEdit={(qol) => { setEditingItem(qol); setShowModal(true); }}
            onDelete={(id) => handleDelete('neighborhood_quality_of_life', id)}
            onNew={() => { setEditingItem({}); setShowModal(true); }}
          />
        )}
      </div>

      {/* Edit Modal for all tabs */}
      {showModal && editingItem && (
        <EditModal
          item={editingItem}
          table={activeTab === 'cities' ? 'investment_locations' : activeTab === 'neighborhoods' ? 'neighborhoods' : 'neighborhood_quality_of_life'}
          type={activeTab}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  )
}

// Cities Tab Component
function CitiesTab({ cities, onEdit, onDelete, onNew }) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Investment Locations</h2>
        <button onClick={onNew} className="btn-new">+ New Location</button>
      </div>

      <div className="data-grid">
        {cities.map(city => (
          <div key={city.id} className="data-card" onClick={() => onEdit(city)} style={{cursor: 'pointer'}}>
            <div className="card-image">
              <img src={city.image_url || city.hero_image_url || 'https://via.placeholder.com/400x200?text=No+Image'} alt={city.city} />
            </div>
            <div className="card-content">
              <h3>{city.city}</h3>
              <p className="description">{city.country}</p>
              {city.is_preferred && <span className="badge-preferred">⭐ Preferred</span>}
              <p className="description">{city.description?.substring(0, 100)}...</p>
              <div className="card-actions">
                <button onClick={(e) => { e.stopPropagation(); onEdit(city); }} className="btn-edit">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(city.id); }} className="btn-delete">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Neighborhoods Tab Component
function NeighborhoodsTab({ neighborhoods, onEdit, onDelete, onNew }) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Neighborhoods</h2>
        <button onClick={onNew} className="btn-new">+ New Neighborhood</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Name</th>
              <th>Price/sqm (EUR)</th>
              <th>Rental Yield</th>
              <th>Days to Rent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {neighborhoods.map(n => (
              <tr key={n.id}>
                <td>{n.city_name}</td>
                <td><strong>{n.name}</strong></td>
                <td>€{n.price_per_sqm_eur_min} - €{n.price_per_sqm_eur_max}</td>
                <td>{n.rental_yield_min}% - {n.rental_yield_max}%</td>
                <td>{n.days_to_rent_avg} days</td>
                <td>
                  <button onClick={() => onEdit(n)} className="btn-sm btn-edit">Edit</button>
                  <button onClick={() => onDelete(n.id)} className="btn-sm btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Quality of Life Tab Component
function QualityOfLifeTab({ qualityOfLife, onEdit, onDelete, onNew }) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Quality of Life Data</h2>
        <button onClick={onNew} className="btn-new">+ New QoL Record</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Neighborhood</th>
              <th>Restaurants</th>
              <th>Walkability</th>
              <th>Safety</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {qualityOfLife.map(qol => (
              <tr key={qol.id}>
                <td>{qol.city_name}</td>
                <td><strong>{qol.neighborhood_name}</strong></td>
                <td>{qol.amenities_restaurants}</td>
                <td>{qol.transport_walkability}%</td>
                <td>{qol.lifestyle_safety}</td>
                <td>
                  <button onClick={() => onEdit(qol)} className="btn-sm btn-edit">Edit</button>
                  <button onClick={() => onDelete(qol.id)} className="btn-sm btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Edit Modal Component (for Neighborhoods and QoL)
function EditModal({ item, table, type, onSave, onClose }) {
  const [formData, setFormData] = useState(item)
  const isNew = !item.id

  // Update formData when item prop changes (after fetchData completes)
  useEffect(() => {
    setFormData(item)
  }, [item])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Modal submitting:', formData)
    onSave(table, formData, isNew)
  }

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'New' : 'Edit'} {type === 'cities' ? 'Investment Location' : type === 'neighborhoods' ? 'Neighborhood' : 'Quality of Life'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {type === 'cities' && (
            <LocationForm formData={formData} updateField={updateField} />
          )}
          {type === 'neighborhoods' && (
            <NeighborhoodForm formData={formData} updateField={updateField} />
          )}
          {type === 'qol' && (
            <QoLForm formData={formData} updateField={updateField} />
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Location Form Fields
function LocationForm({ formData, updateField }) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Country *</label>
          <input
            type="text"
            value={formData.country || ''}
            onChange={(e) => updateField('country', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Country Code</label>
          <input
            type="text"
            value={formData.country_code || ''}
            onChange={(e) => updateField('country_code', e.target.value)}
            placeholder="PT, ES, FR"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows="3"
          placeholder="Brief description of the investment location"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.is_preferred || false}
              onChange={(e) => updateField('is_preferred', e.target.checked)}
            />
            {' '}Is Preferred Location
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.residency_program || false}
              onChange={(e) => updateField('residency_program', e.target.checked)}
            />
            {' '}Has Residency Program
          </label>
        </div>
      </div>

      <h4>Images</h4>
      <div className="form-group">
        <label>Hero Image URL</label>
        <input
          type="url"
          value={formData.hero_image_url || ''}
          onChange={(e) => updateField('hero_image_url', e.target.value)}
          placeholder="https://example.com/hero.jpg"
        />
        {formData.hero_image_url && (
          <img src={formData.hero_image_url} alt="Hero preview" className="image-preview" style={{maxWidth: '100%', marginTop: '10px', borderRadius: '4px'}} />
        )}
      </div>
      <div className="form-group">
        <label>Image URL</label>
        <input
          type="url"
          value={formData.image_url || ''}
          onChange={(e) => updateField('image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {formData.image_url && (
          <img src={formData.image_url} alt="Image preview" className="image-preview" style={{maxWidth: '100%', marginTop: '10px', borderRadius: '4px'}} />
        )}
      </div>

      <h4>Price per sqm (EUR)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min (€)</label>
          <input
            type="number"
            value={formData.price_per_sqm_eur_min || ''}
            onChange={(e) => updateField('price_per_sqm_eur_min', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Max (€)</label>
          <input
            type="number"
            value={formData.price_per_sqm_eur_max || ''}
            onChange={(e) => updateField('price_per_sqm_eur_max', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Price per sqm (USD)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min ($)</label>
          <input
            type="number"
            value={formData.price_per_sqm_usd_min || ''}
            onChange={(e) => updateField('price_per_sqm_usd_min', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Max ($)</label>
          <input
            type="number"
            value={formData.price_per_sqm_usd_max || ''}
            onChange={(e) => updateField('price_per_sqm_usd_max', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Price per sqm (GBP)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min (£)</label>
          <input
            type="number"
            value={formData.price_per_sqm_gbp_min || ''}
            onChange={(e) => updateField('price_per_sqm_gbp_min', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Max (£)</label>
          <input
            type="number"
            value={formData.price_per_sqm_gbp_max || ''}
            onChange={(e) => updateField('price_per_sqm_gbp_max', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Rental Information</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Rental Yield Min (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.rental_yield_min || ''}
            onChange={(e) => updateField('rental_yield_min', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Rental Yield Max (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.rental_yield_max || ''}
            onChange={(e) => updateField('rental_yield_max', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Days to Rent (Avg)</label>
          <input
            type="number"
            value={formData.days_to_rent_avg || ''}
            onChange={(e) => updateField('days_to_rent_avg', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Market Scores (0-10)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Liquidity Score</label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.liquidity_score || ''}
            onChange={(e) => updateField('liquidity_score', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Market Transparency</label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.market_transparency || ''}
            onChange={(e) => updateField('market_transparency', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Income Stability</label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.income_stability || ''}
            onChange={(e) => updateField('income_stability', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Growth Potential</label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.growth_potential || ''}
            onChange={(e) => updateField('growth_potential', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Lifestyle Appeal</label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.lifestyle_appeal || ''}
            onChange={(e) => updateField('lifestyle_appeal', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Sophistication Required</label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.sophistication_required || ''}
            onChange={(e) => updateField('sophistication_required', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Market Information</h4>
      <div className="form-group">
        <label>Market Maturity</label>
        <select
          value={formData.market_maturity || ''}
          onChange={(e) => updateField('market_maturity', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="Emerging">Emerging</option>
          <option value="Developing">Developing</option>
          <option value="Mature">Mature</option>
        </select>
      </div>

      <div className="form-group">
        <label>Entry Barriers</label>
        <textarea
          value={formData.entry_barriers || ''}
          onChange={(e) => updateField('entry_barriers', e.target.value)}
          rows="2"
          placeholder="Description of entry barriers for investors"
        />
      </div>

      <div className="form-group">
        <label>Tax Advantages</label>
        <textarea
          value={formData.tax_advantages || ''}
          onChange={(e) => updateField('tax_advantages', e.target.value)}
          rows="2"
          placeholder="Description of tax advantages"
        />
      </div>

      <div className="form-group">
        <label>Highlights (JSON array)</label>
        <textarea
          value={formData.highlights ? JSON.stringify(formData.highlights) : '[]'}
          onChange={(e) => {
            try {
              updateField('highlights', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="3"
          placeholder='["Highlight 1", "Highlight 2", "Highlight 3"]'
        />
      </div>

      <div className="form-group">
        <label>Investor Profile Match (JSON array)</label>
        <textarea
          value={formData.investor_profile_match ? JSON.stringify(formData.investor_profile_match) : '[]'}
          onChange={(e) => {
            try {
              updateField('investor_profile_match', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="2"
          placeholder='["Income Seeker", "Growth Investor", "Lifestyle Investor"]'
        />
      </div>

      <div className="form-group">
        <label>Price Growth 5Y (JSON array of 5 numbers)</label>
        <textarea
          value={formData.price_growth_5y ? JSON.stringify(formData.price_growth_5y) : '[]'}
          onChange={(e) => {
            try {
              updateField('price_growth_5y', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="2"
          placeholder='[10.5, 14.2, 17.8, 21.5, 24.8]'
        />
      </div>
    </>
  )
}

// Neighborhood Form Fields
function NeighborhoodForm({ formData, updateField }) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>City Name *</label>
          <input
            type="text"
            value={formData.city_name || ''}
            onChange={(e) => updateField('city_name', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Neighborhood Name *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Image URL</label>
        <input
          type="url"
          value={formData.image_url || ''}
          onChange={(e) => updateField('image_url', e.target.value)}
        />
        {formData.image_url && (
          <img src={formData.image_url} alt="Neighborhood preview" className="image-preview" style={{maxWidth: '100%', marginTop: '10px', borderRadius: '4px'}} />
        )}
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows="3"
        />
      </div>

      <h4>Price per sqm (EUR)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min (€)</label>
          <input
            type="number"
            value={formData.price_per_sqm_eur_min || ''}
            onChange={(e) => updateField('price_per_sqm_eur_min', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Max (€)</label>
          <input
            type="number"
            value={formData.price_per_sqm_eur_max || ''}
            onChange={(e) => updateField('price_per_sqm_eur_max', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Price per sqm (USD)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min ($)</label>
          <input
            type="number"
            value={formData.price_per_sqm_usd_min || ''}
            onChange={(e) => updateField('price_per_sqm_usd_min', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Max ($)</label>
          <input
            type="number"
            value={formData.price_per_sqm_usd_max || ''}
            onChange={(e) => updateField('price_per_sqm_usd_max', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Price per sqm (GBP)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min (£)</label>
          <input
            type="number"
            value={formData.price_per_sqm_gbp_min || ''}
            onChange={(e) => updateField('price_per_sqm_gbp_min', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Max (£)</label>
          <input
            type="number"
            value={formData.price_per_sqm_gbp_max || ''}
            onChange={(e) => updateField('price_per_sqm_gbp_max', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Rental Information</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Rental Yield Min (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.rental_yield_min || ''}
            onChange={(e) => updateField('rental_yield_min', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Rental Yield Max (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.rental_yield_max || ''}
            onChange={(e) => updateField('rental_yield_max', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Days to Rent (Avg)</label>
          <input
            type="number"
            value={formData.days_to_rent_avg || ''}
            onChange={(e) => updateField('days_to_rent_avg', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Rent per sqm</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Rent per sqm EUR (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.rent_per_sqm_eur || ''}
            onChange={(e) => updateField('rent_per_sqm_eur', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Rent per sqm USD ($)</label>
          <input
            type="number"
            step="0.01"
            value={formData.rent_per_sqm_usd || ''}
            onChange={(e) => updateField('rent_per_sqm_usd', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Rent per sqm GBP (£)</label>
          <input
            type="number"
            step="0.01"
            value={formData.rent_per_sqm_gbp || ''}
            onChange={(e) => updateField('rent_per_sqm_gbp', parseFloat(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Investment Metrics</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Acquisition Tax (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.acquisition_tax || ''}
            onChange={(e) => updateField('acquisition_tax', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Recommended Holding Time (years)</label>
          <input
            type="number"
            value={formData.recommended_holding_time || ''}
            onChange={(e) => updateField('recommended_holding_time', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Price Growth EUR (5 years - JSON array)</label>
        <textarea
          value={formData.price_growth_eur ? JSON.stringify(formData.price_growth_eur) : '[]'}
          onChange={(e) => {
            try {
              updateField('price_growth_eur', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="2"
          placeholder='[10.5, 14.2, 17.8, 21.5, 24.8]'
        />
      </div>

      <div className="form-group">
        <label>Price Growth USD (5 years - JSON array)</label>
        <textarea
          value={formData.price_growth_usd ? JSON.stringify(formData.price_growth_usd) : '[]'}
          onChange={(e) => {
            try {
              updateField('price_growth_usd', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="2"
          placeholder='[10.5, 14.2, 17.8, 21.5, 24.8]'
        />
      </div>

      <div className="form-group">
        <label>Price Growth GBP (5 years - JSON array)</label>
        <textarea
          value={formData.price_growth_gbp ? JSON.stringify(formData.price_growth_gbp) : '[]'}
          onChange={(e) => {
            try {
              updateField('price_growth_gbp', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="2"
          placeholder='[10.5, 14.2, 17.8, 21.5, 24.8]'
        />
      </div>
    </>
  )
}

// QoL Form Fields
function QoLForm({ formData, updateField }) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>City Name *</label>
          <input
            type="text"
            value={formData.city_name || ''}
            onChange={(e) => updateField('city_name', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Neighborhood Name *</label>
          <input
            type="text"
            value={formData.neighborhood_name || ''}
            onChange={(e) => updateField('neighborhood_name', e.target.value)}
            required
          />
        </div>
      </div>

      <h4>Amenities</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Restaurants</label>
          <input
            type="number"
            value={formData.amenities_restaurants || ''}
            onChange={(e) => updateField('amenities_restaurants', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Cafés</label>
          <input
            type="number"
            value={formData.amenities_cafes || ''}
            onChange={(e) => updateField('amenities_cafes', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Supermarkets</label>
          <input
            type="number"
            value={formData.amenities_supermarkets || ''}
            onChange={(e) => updateField('amenities_supermarkets', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Parks</label>
          <input
            type="number"
            value={formData.amenities_parks || ''}
            onChange={(e) => updateField('amenities_parks', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Gyms</label>
          <input
            type="number"
            value={formData.amenities_gyms || ''}
            onChange={(e) => updateField('amenities_gyms', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Schools</label>
          <input
            type="number"
            value={formData.amenities_schools || ''}
            onChange={(e) => updateField('amenities_schools', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Transportation</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Metro Stations</label>
          <input
            type="number"
            value={formData.transport_metro_stations || ''}
            onChange={(e) => updateField('transport_metro_stations', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Bus Lines</label>
          <input
            type="number"
            value={formData.transport_bus_lines || ''}
            onChange={(e) => updateField('transport_bus_lines', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Train Stations</label>
          <input
            type="number"
            value={formData.transport_train_stations || ''}
            onChange={(e) => updateField('transport_train_stations', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Bike Lanes (km)</label>
          <input
            type="number"
            step="0.1"
            value={formData.transport_bike_lanes_km || ''}
            onChange={(e) => updateField('transport_bike_lanes_km', parseFloat(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Walkability (%)</label>
          <input
            type="number"
            value={formData.transport_walkability || ''}
            onChange={(e) => updateField('transport_walkability', parseInt(e.target.value) || null)}
          />
        </div>
        <div className="form-group">
          <label>Avg Commute Time (min)</label>
          <input
            type="number"
            value={formData.transport_avg_commute_time_min || ''}
            onChange={(e) => updateField('transport_avg_commute_time_min', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <h4>Lifestyle</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Nightlife</label>
          <select
            value={formData.lifestyle_nightlife || ''}
            onChange={(e) => updateField('lifestyle_nightlife', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Shopping</label>
          <select
            value={formData.lifestyle_shopping || ''}
            onChange={(e) => updateField('lifestyle_shopping', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Culture</label>
          <select
            value={formData.lifestyle_culture || ''}
            onChange={(e) => updateField('lifestyle_culture', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Safety</label>
          <select
            value={formData.lifestyle_safety || ''}
            onChange={(e) => updateField('lifestyle_safety', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Green Spaces</label>
          <select
            value={formData.lifestyle_green_spaces || ''}
            onChange={(e) => updateField('lifestyle_green_spaces', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Family Friendly</label>
          <select
            value={formData.lifestyle_family_friendly || ''}
            onChange={(e) => updateField('lifestyle_family_friendly', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Popularity Factors (JSON array)</label>
        <textarea
          value={JSON.stringify(formData.popularity_factors || [])}
          onChange={(e) => {
            try {
              updateField('popularity_factors', JSON.parse(e.target.value))
            } catch (err) {
              // Keep invalid JSON for user to fix
            }
          }}
          rows="3"
          placeholder='["Factor 1", "Factor 2", "Factor 3"]'
        />
      </div>
    </>
  )
}
