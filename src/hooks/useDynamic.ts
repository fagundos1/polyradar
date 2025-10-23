import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useDynamic() {
  const { primaryWallet, user, setShowAuthFlow, handleLogOut } = useDynamicContext();
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [radarBalance, setRadarBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (primaryWallet && user) {
        const address = primaryWallet.address;
        setWalletAddress(address);

        try {
          // Проверяем, существует ли пользователь в Supabase
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', address)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            // Устанавливаем баланс по умолчанию для тестирования
            setRadarBalance(500);
            setIsLoading(false);
            return;
          }

          if (!existingUser) {
            // Создаем нового пользователя с 5 бесплатными поисками (500 токенов)
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                wallet_address: address,
                radar_balance: 500,
                free_searches_used: 0,
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating user:', insertError);
              // Устанавливаем баланс по умолчанию для тестирования
              setRadarBalance(500);
            } else if (newUser) {
              setRadarBalance(newUser.radar_balance);
            }
          } else {
            setRadarBalance(existingUser.radar_balance);
          }
        } catch (error) {
          console.error('Error initializing user:', error);
          // Устанавливаем баланс по умолчанию для тестирования
          setRadarBalance(500);
        }
      } else {
        setWalletAddress(undefined);
        setRadarBalance(0);
      }
      setIsLoading(false);
    };

    initializeUser();
  }, [primaryWallet, user]);

  const connectWallet = () => {
    setShowAuthFlow(true);
  };

  const disconnectWallet = async () => {
    await handleLogOut();
    setWalletAddress(undefined);
    setRadarBalance(0);
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;

    const { data, error } = await supabase
      .from('users')
      .select('radar_balance')
      .eq('wallet_address', walletAddress)
      .single();

    if (!error && data) {
      setRadarBalance(data.radar_balance);
    }
  };

  return {
    walletAddress,
    radarBalance,
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    isConnected: !!walletAddress,
  };
}

