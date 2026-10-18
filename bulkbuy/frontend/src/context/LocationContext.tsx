import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SocietyHub {
  city: string;
  state: string;
  pincode: string;
  society: string;
  societyCount: number;
  deliveryDays: string;
}

export const POPULAR_HUBS: SocietyHub[] = [
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    society: 'Bellandur & Outer Ring Road (Prestige, Sobha, Palm Meadows)',
    societyCount: 142,
    deliveryDays: '2-3 days post campaign close',
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    society: 'Whitefield & ITPL Belt (Godrej, Brigade Metropolis)',
    societyCount: 98,
    deliveryDays: '2-3 days post campaign close',
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    society: 'DLF Phase 5 & Golf Course Road (The Aralias, Magnolias, Pinnacle)',
    societyCount: 84,
    deliveryDays: '3-4 days post campaign close',
  },
  {
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    society: 'Noida Expressway & Sector 137 (Paras Tierea, Supertech Ecociti)',
    societyCount: 65,
    deliveryDays: '3-4 days post campaign close',
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    society: 'Powai & Hiranandani Gardens (Nahar Amrit Shakti, Lake Homes)',
    societyCount: 110,
    deliveryDays: '2-4 days post campaign close',
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    society: 'Wakad & Hinjawadi Hub (Kolte Patil Life Republic, Rohan Tarang)',
    societyCount: 76,
    deliveryDays: '3-4 days post campaign close',
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    society: 'Gachibowli & Financial District (My Home Bhooja, Aparna Sarovar)',
    societyCount: 92,
    deliveryDays: '3-4 days post campaign close',
  },
];

interface LocationContextType {
  currentHub: SocietyHub;
  setHub: (hub: SocietyHub) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  searchPincode: (pincode: string) => SocietyHub | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentHub, setCurrentHub] = useState<SocietyHub>(() => {
    try {
      const saved = localStorage.getItem('bulkbuy_selected_hub');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return POPULAR_HUBS[0];
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const setHub = (hub: SocietyHub) => {
    setCurrentHub(hub);
    try {
      localStorage.setItem('bulkbuy_selected_hub', JSON.stringify(hub));
    } catch {
      // harmless
    }
  };

  const searchPincode = (pin: string): SocietyHub | null => {
    const cleaned = pin.trim();
    const exact = POPULAR_HUBS.find((h) => h.pincode === cleaned);
    if (exact) return exact;

    // Smart partial region matcher based on first 2 digits
    if (cleaned.startsWith('56')) {
      return {
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: cleaned,
        society: `Bengaluru East Hub (PIN ${cleaned})`,
        societyCount: 45,
        deliveryDays: '2-3 days post campaign close',
      };
    }
    if (cleaned.startsWith('11') || cleaned.startsWith('12') || cleaned.startsWith('20')) {
      return {
        city: 'Delhi NCR',
        state: 'NCR',
        pincode: cleaned,
        society: `Delhi NCR Metro Cluster (PIN ${cleaned})`,
        societyCount: 52,
        deliveryDays: '3-4 days post campaign close',
      };
    }
    if (cleaned.startsWith('40') || cleaned.startsWith('41')) {
      return {
        city: 'Mumbai / Pune Region',
        state: 'Maharashtra',
        pincode: cleaned,
        society: `Western Corridor Hub (PIN ${cleaned})`,
        societyCount: 60,
        deliveryDays: '3-4 days post campaign close',
      };
    }
    if (cleaned.startsWith('50')) {
      return {
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: cleaned,
        society: `Hyderabad Tech Cluster (PIN ${cleaned})`,
        societyCount: 38,
        deliveryDays: '3-4 days post campaign close',
      };
    }

    // Default valid pan-India collective hub
    if (/^\d{6}$/.test(cleaned)) {
      return {
        city: 'Metro Regional Center',
        state: 'India',
        pincode: cleaned,
        society: `Direct Society Pallet Delivery Zone (PIN ${cleaned})`,
        societyCount: 24,
        deliveryDays: '3-5 days post campaign close',
      };
    }

    return null;
  };

  return (
    <LocationContext.Provider
      value={{
        currentHub,
        setHub,
        isLocationModalOpen,
        setIsLocationModalOpen,
        searchPincode,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
