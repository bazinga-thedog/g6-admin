# G6 Intelligence - Admin Panel

A comprehensive backoffice admin panel for managing G6 Intelligence investment data.

## Features

- 🔐 **Password Protected** - Secure access to admin functions
- 📊 **City Overview Management** - Edit city descriptions, metrics, and highlights
- 🏘️ **Neighborhoods Management** - Manage all neighborhood investment data
- 🌟 **Quality of Life Data** - Update amenities, transportation, and lifestyle ratings
- ✏️ **Full CRUD Operations** - Create, Read, Update, Delete all records
- 🎨 **Modern UI** - Gradient design with responsive layout
- 💾 **Real-time Sync** - Changes reflect immediately in the main app

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/g6-admin.git
cd g6-admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run the development server**
```bash
npm run dev
```

5. **Access the admin panel**
Open http://localhost:5173 in your browser

## Default Login

**Password**: `admin123`

⚠️ **IMPORTANT**: Change the password in `src/AdminPanel.jsx` line 22 before deploying to production!

## Usage

### Managing Cities

1. Click the **"City Overview"** tab
2. View all cities in card grid
3. Click **"Edit"** to modify city data
4. Click **"+ New City"** to add a new city
5. Update fields and click **"Save"**

### Managing Neighborhoods

1. Click the **"Neighborhoods"** tab
2. View all neighborhoods in table
3. Click **"Edit"** to modify neighborhood data
4. Update metrics, prices, and investment data
5. Save changes

### Managing Quality of Life

1. Click the **"Quality of Life"** tab
2. View all QoL records in table
3. Edit amenities, transportation, lifestyle ratings
4. Update popularity factors
5. Save changes

## Data Structure

### City Overview
- City name, hero image, description
- Key highlights (JSON array)
- Average price per sqm (EUR, USD, GBP)
- Average rental yield, days to rent
- 5-year growth trends

### Neighborhoods
- Name, city, image, description
- Price ranges per sqm (multi-currency)
- Rental yield ranges
- Investment metrics (tax, holding time, etc.)
- Rent per sqm, growth arrays

### Quality of Life
- City and neighborhood references
- Amenities counts (restaurants, cafés, etc.)
- Transportation data (metro, bus, walkability)
- Lifestyle ratings (nightlife, shopping, culture, safety)
- Popularity factors (JSON array)

## JSON Field Format

### Highlights / Popularity Factors
```json
["Point 1", "Point 2", "Point 3"]
```

### Growth Arrays (5 years)
```json
[10.5, 14.2, 17.8, 21.5, 24.8]
```

## Security

### Before Production

1. **Change the default password**
   - Edit `src/AdminPanel.jsx` line 22
   - Use a strong, unique password

2. **Implement proper authentication**
   - Use Supabase Auth
   - Add user roles and permissions
   - Implement JWT tokens

3. **Update RLS policies**
   ```sql
   CREATE POLICY "Only authenticated admins can update"
     ON table_name
     FOR UPDATE
     USING (auth.role() = 'authenticated');
   ```

4. **Add audit logging**
   - Track who changed what and when
   - Store in audit tables

5. **Enable rate limiting**
   - Prevent abuse
   - Use Supabase rate limiting features

## Database Schema

The admin panel connects to three Supabase tables:

- `city_overview` - City-level data (3 records)
- `neighborhoods` - Neighborhood data (15 records)
- `neighborhood_quality_of_life` - Lifestyle data (15 records)

See the main G6 Intelligence repository for SQL schema files.

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Supabase** - Backend and database
- **CSS** - Styling (no framework dependencies)

## Project Structure

```
G6-Admin/
├── src/
│   ├── AdminPanel.jsx      # Main admin component
│   ├── AdminPanel.css      # Admin panel styles
│   ├── supabaseClient.js   # Supabase configuration
│   ├── App.jsx             # App entry point
│   └── App.css             # Global styles
├── .env.example            # Environment variables template
├── package.json            # Dependencies
└── README.md               # This file
```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Custom Server
Upload the `dist/` directory to your web server.

## Troubleshooting

### "Error loading data"
- Check Supabase credentials in `.env`
- Verify Supabase project is accessible
- Check RLS policies allow read access

### "Error saving"
- Verify required fields are filled
- Check JSON syntax for array fields
- Check console for detailed error messages

### Changes not appearing
- Refresh the data by switching tabs
- Logout and login again
- Clear browser cache

## Support

For issues and feature requests, please open an issue on GitHub.

## License

MIT License - See LICENSE file for details

## Related Projects

- [G6 Intelligence](https://github.com/yourusername/g6-intelligence) - Main application
