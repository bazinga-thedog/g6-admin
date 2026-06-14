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
        supabase.from('city_overview').select('*').order('city_name'),
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

      if (isNew) {
        const { error } = await supabase.from(table).insert([data])
        if (error) throw error
        setMessage({ type: 'success', text: 'Created successfully!' })
      } else {
        const { error } = await supabase.from(table).update(data).eq('id', data.id)
        if (error) throw error
        setMessage({ type: 'success', text: 'Updated successfully!' })
      }

      await fetchData()
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
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
          City Overview ({cities.length})
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
            onDelete={(id) => handleDelete('city_overview', id)}
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

      {/* Edit Modal */}
      {showModal && editingItem && (
        <EditModal
          item={editingItem}
          table={activeTab === 'cities' ? 'city_overview' : activeTab === 'neighborhoods' ? 'neighborhoods' : 'neighborhood_quality_of_life'}
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
        <h2>City Overview</h2>
        <button onClick={onNew} className="btn-new">+ New City</button>
      </div>

      <div className="data-grid">
        {cities.map(city => (
          <div key={city.id} className="data-card">
            <div className="card-image">
              <img src={city.hero_image_url} alt={city.city_name} />
            </div>
            <div className="card-content">
              <h3>{city.city_name}</h3>
              <p className="description">{city.description?.substring(0, 150)}...</p>
              <div className="metrics">
                <span>Yield: {city.avg_rental_yield}%</span>
                <span>Days to Rent: {city.avg_days_to_rent}</span>
              </div>
              <div className="card-actions">
                <button onClick={() => onEdit(city)} className="btn-edit">Edit</button>
                <button onClick={() => onDelete(city.id)} className="btn-delete">Delete</button>
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

// Edit Modal Component
function EditModal({ item, table, type, onSave, onClose }) {
  const [formData, setFormData] = useState(item)
  const isNew = !item.id

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(table, formData, isNew)
  }

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'New' : 'Edit'} {type === 'cities' ? 'City' : type === 'neighborhoods' ? 'Neighborhood' : 'Quality of Life'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {type === 'cities' && (
            <CityForm formData={formData} updateField={updateField} />
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

// City Form Fields
function CityForm({ formData, updateField }) {
  return (
    <>
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
        <label>Hero Image URL</label>
        <input
          type="url"
          value={formData.hero_image_url || ''}
          onChange={(e) => updateField('hero_image_url', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Highlights (JSON array)</label>
        <textarea
          value={JSON.stringify(formData.highlights || [])}
          onChange={(e) => {
            try {
              updateField('highlights', JSON.parse(e.target.value))
            } catch (err) {
              updateField('highlights', e.target.value)
            }
          }}
          rows="3"
          placeholder='["Highlight 1", "Highlight 2"]'
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Avg Price/sqm EUR Min</label>
          <input
            type="number"
            value={formData.avg_price_per_sqm_eur_min || ''}
            onChange={(e) => updateField('avg_price_per_sqm_eur_min', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Avg Price/sqm EUR Max</label>
          <input
            type="number"
            value={formData.avg_price_per_sqm_eur_max || ''}
            onChange={(e) => updateField('avg_price_per_sqm_eur_max', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Avg Rental Yield (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.avg_rental_yield || ''}
            onChange={(e) => updateField('avg_rental_yield', parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Avg Days to Rent</label>
          <input
            type="number"
            value={formData.avg_days_to_rent || ''}
            onChange={(e) => updateField('avg_days_to_rent', parseInt(e.target.value))}
          />
        </div>
      </div>
    </>
  )
}

// Neighborhood Form Fields (abbreviated for brevity - expand as needed)
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
          <label>Min</label>
          <input
            type="number"
            value={formData.price_per_sqm_eur_min || ''}
            onChange={(e) => updateField('price_per_sqm_eur_min', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Max</label>
          <input
            type="number"
            value={formData.price_per_sqm_eur_max || ''}
            onChange={(e) => updateField('price_per_sqm_eur_max', parseInt(e.target.value))}
          />
        </div>
      </div>

      <h4>Rental Yield (%)</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Min</label>
          <input
            type="number"
            step="0.1"
            value={formData.rental_yield_min || ''}
            onChange={(e) => updateField('rental_yield_min', parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Max</label>
          <input
            type="number"
            step="0.1"
            value={formData.rental_yield_max || ''}
            onChange={(e) => updateField('rental_yield_max', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Days to Rent (Avg)</label>
        <input
          type="number"
          value={formData.days_to_rent_avg || ''}
          onChange={(e) => updateField('days_to_rent_avg', parseInt(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label>Acquisition Tax (%)</label>
        <input
          type="number"
          step="0.1"
          value={formData.acquisition_tax || ''}
          onChange={(e) => updateField('acquisition_tax', parseFloat(e.target.value))}
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
            onChange={(e) => updateField('amenities_restaurants', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Cafés</label>
          <input
            type="number"
            value={formData.amenities_cafes || ''}
            onChange={(e) => updateField('amenities_cafes', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Supermarkets</label>
          <input
            type="number"
            value={formData.amenities_supermarkets || ''}
            onChange={(e) => updateField('amenities_supermarkets', parseInt(e.target.value))}
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
            onChange={(e) => updateField('transport_metro_stations', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Bus Lines</label>
          <input
            type="number"
            value={formData.transport_bus_lines || ''}
            onChange={(e) => updateField('transport_bus_lines', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Walkability (%)</label>
          <input
            type="number"
            value={formData.transport_walkability || ''}
            onChange={(e) => updateField('transport_walkability', parseInt(e.target.value))}
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
      </div>

      <div className="form-group">
        <label>Popularity Factors (JSON array)</label>
        <textarea
          value={JSON.stringify(formData.popularity_factors || [])}
          onChange={(e) => {
            try {
              updateField('popularity_factors', JSON.parse(e.target.value))
            } catch (err) {
              updateField('popularity_factors', e.target.value)
            }
          }}
          rows="3"
          placeholder='["Factor 1", "Factor 2"]'
        />
      </div>
    </>
  )
}
