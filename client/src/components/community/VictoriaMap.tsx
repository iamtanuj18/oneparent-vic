// interactive map component for displaying victoria location data
'use client'

import React from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { type PpsHotspotDetail } from '../../lib/api/insights'

interface VictoriaMapProps {
  data: PpsHotspotDetail[]
}

const VictoriaMap: React.FC<VictoriaMapProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">No data available for map</div>
      </div>
    )
  }

  const maxRecipients = Math.max(...data.map(d => d.recipients))

  return (
    <div className="relative h-96 rounded-lg overflow-hidden">
      <MapContainer
        center={[-37.4713, 144.7852]} // victoria center coordinates
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="leaflet-container"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* plot data points as circles */}
        {data.map((item, idx) => {
          const intensity = item.recipients / maxRecipients
          
          // calculate circle size (5px to 25px)
          const radius = Math.max(5, intensity * 25)
          
          // color based on intensity
          const color = intensity > 0.8 ? '#dc2626' :  // red-600
                       intensity > 0.6 ? '#ea580c' :  // orange-600  
                       intensity > 0.4 ? '#ca8a04' :  // yellow-600
                       intensity > 0.2 ? '#2563eb' : '#60a5fa' // blue-600 / blue-400
          
          return (
            <CircleMarker
              key={idx}
              center={[item.latitude, item.longitude]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2
              }}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{item.suburb}</div>
                  <div className="text-lg font-bold text-blue-600">{item.recipients.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">recipients</div>
                </div>
              </Popup>
              <Tooltip>
                <span>{item.suburb}: {item.recipients.toLocaleString()}</span>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
      
      {/* map legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="text-xs font-semibold mb-2">Recipients</div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            <span>Med</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VictoriaMap