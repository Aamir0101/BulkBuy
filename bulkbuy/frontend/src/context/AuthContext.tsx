import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Address, Supplier, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  addresses: Address[];
  supplierDetails: Supplier | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; fullName: string; phone: string; role?: 'CUSTOMER' | 'SUPPLIER' }) => Promise<void>;
  updateProfile: (payload: { fullName: string; phone: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickSwitchDemoAccount: (targetRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [supplierDetails, setSupplierDetails] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      if (api.getToken()) {
        const res = await api.getMe();
        setUser(res.user);
        setAddresses(res.addresses || []);
        setSupplierDetails(res.supplierDetails || null);
      } else {
        setUser(null);
        setAddresses([]);
        setSupplierDetails(null);
      }
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      api.setToken(res.token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { email: string; password: string; fullName: string; phone: string; role?: 'CUSTOMER' | 'SUPPLIER' }) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('bulkbuy_logged_out');
      const res = await api.register(payload);
      api.setToken(res.token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: { fullName: string; phone: string }) => {
    setIsLoading(true);
    try {
      const res = await api.updateProfile(payload);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setAddresses([]);
      setSupplierDetails(null);
    }
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  const quickSwitchDemoAccount = async (targetRole: UserRole) => {
    if (targetRole === 'ADMIN') {
      await login('admin@bulkbuy.in', 'admin123');
    } else if (targetRole === 'SUPPLIER') {
      await login('supplier@amaraagro.in', 'supplier123');
    } else {
      await login('priya.sharma@example.com', 'customer123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        addresses,
        supplierDetails,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
        quickSwitchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
