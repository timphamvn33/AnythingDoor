import { useEffect, useRef, useState } from 'react';
import api from '@/api/axios';
import RestaurantThumbnail from '@/components/shared/RestaurantThumbnail';

type PhotoResult =
  | { status: 'disabled' | 'not-found' | 'limit-reached' }
  | {
      status: 'available';
      url: string;
      googleMapsUri: string;
      attributions: { name: string; uri: string | null; photoUri: string | null }[];
    };

export default function RestaurantPhoto({
  source,
  id,
  name,
  categories,
}: {
  source: 'discovery' | 'souslab';
  id: string;
  name: string;
  categories: string[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<PhotoResult | { status: 'error' } | null>(null);

  useEffect(() => {
    setResult(null);
    const element = container.current;
    if (!element) return;
    const controller = new AbortController();
    if (typeof IntersectionObserver === 'undefined') {
      setResult({ status: 'error' });
      return () => controller.abort();
    }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void api
        .get<PhotoResult>('place-photos', { params: { source, id }, signal: controller.signal })
        .then(response => setResult(response.data))
        .catch(() => {
          if (!controller.signal.aborted) {
            setResult({ status: 'error' });
          }
        });
    });
    observer.observe(element);
    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [source, id]);

  return (
    <div ref={container}>
      {result?.status === 'available' ? (
        <figure className="border-b bg-white">
          <img
            src={result.url}
            alt={`Photo of ${name}`}
            className="h-40 w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setResult({ status: 'error' })}
          />
          <figcaption className="text-xs text-[#5e5e5e]">
            <img
              src="/images/google-maps-attribution.svg"
              alt="Google Maps"
              className="mx-[10px] mb-[5px] mt-[10px] h-[18px] w-auto"
            />
            <a
              href={result.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2 underline"
            >
              View photo on Google Maps
            </a>
            {result.attributions.map((credit, index) => (
              <span key={`${credit.name}-${index}`} className="inline-flex items-center">
                {' · '}
                {credit.photoUri && (
                  <img
                    src={credit.photoUri}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="mx-1 h-5 w-5 rounded-full"
                  />
                )}
                {credit.uri ? (
                  <a
                    href={credit.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {credit.name}
                  </a>
                ) : (
                  credit.name
                )}
              </span>
            ))}
          </figcaption>
        </figure>
      ) : (
        <>
          <RestaurantThumbnail categories={categories} />
          {result?.status === 'limit-reached' && (
            <p className="px-2 py-1 text-xs text-gray-600">Monthly photo request limit reached.</p>
          )}
          {result?.status === 'error' && (
            <p className="px-2 py-1 text-xs text-gray-600">Restaurant photo unavailable.</p>
          )}
        </>
      )}
    </div>
  );
}
