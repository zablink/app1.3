'use client'

useEffect(() => {
    const fetchAdForLocation = (latitude: number, longitude: number) => {
      // The new URL includes a 'strategy=fallback' parameter.
      // The backend API will be responsible for the complex fallback logic:
      // subdistrict -> district -> province -> region -> nationwide.
      // The backend will also handle random selection if multiple ads match a tier.
      fetch(`/api/ads/for-placement?placement=${placement}&lat=${latitude}&lng=${longitude}&strategy=fallback`)
        .then(res => {
          if (res.ok && res.status !== 204) { // 204 No Content means no ad was found
            return res.json();
          }
          return Promise.reject('No ad available or empty response');
        })
        .then((adData: Ad) => {
          if(adData) setAd(adData);
          else setAd(null); // Explicitly set to null if adData is not valid
        })
        .catch(error => {
          console.log(`No ad found for placement ${placement} with fallback strategy:`, error);
          setAd(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAdForLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn('Could not get user location:', error.message);
        // If location is denied, we can try to fetch a nationwide ad as a final fallback.
        fetch(`/api/ads/for-placement?placement=${placement}&strategy=nationwide-only`)
          .then(res => res.ok ? res.json() : Promise.reject('No nationwide ad'))
          .then(setAd)
          .catch(() => setAd(null))
          .finally(() => setIsLoading(false));
      }
    );
  }, [placement]);