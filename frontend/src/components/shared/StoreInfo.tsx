import { useState } from 'react';
import { ChevronDown, ImageOff } from 'lucide-react';
import type { StorePayload } from '@/schemas/store.schema';

interface StoreProbs {
  name: string | undefined;
  openHrs: string | undefined;
  closeHrs: string | undefined;
  category: string[] | undefined;
  actions?: React.ReactNode;
  description?: string;
  address?: StorePayload['address'];
  phoneNumber?: string;
  hours?: StorePayload['hours'];
  imageUrl?: string;
  showImage?: boolean;
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const timeOf = (value: string) => (value.includes('T') ? value.slice(11, 16) : value);

export default function StoreInfo({
  name,
  openHrs,
  closeHrs,
  category,
  actions,
  description,
  address,
  phoneNumber,
  hours,
  imageUrl,
  showImage = false,
}: StoreProbs) {
  const openDays = [...(hours || [])]
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    .map(h => ({ day: h.day, time: `${timeOf(h.opensAt)}–${timeOf(h.closesAt)}` }));
  const [showOperation, setShowOperation] = useState(false);
  const addressText = address
    ? [address.street, address.city, address.state, address.zip, address.country]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <>
      <div>
        <div className="flex items-center gap-1 mb-1">
          <h3 className="text-xl font-semibold">{name}</h3>
          {actions}
        </div>

        {description && <div className="text-sm text-gray-600 mb-0.5">{description}</div>}

        {showImage ? (
          <div className="mb-0.5 text-sm text-gray-600">
            <button
              type="button"
              aria-expanded={showOperation}
              onClick={e => {
                e.stopPropagation();
                setShowOperation(v => !v);
              }}
              className="flex items-center gap-1 font-medium hover:text-gray-900"
            >
              Operation
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showOperation ? 'rotate-180' : ''}`}
              />
            </button>
            {showOperation &&
              (openDays.length === 0 ? (
                <div className="mt-1">Not set — edit the store to choose open days</div>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {openDays.map(d => (
                    <li key={d.day} className="flex gap-3">
                      <span className="w-24 font-medium capitalize">{d.day}</span>
                      <span>{d.time}</span>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-0.5">
              <span className="font-medium">Open Hrs:</span> {openHrs}
            </div>
            <div className="text-sm text-gray-600 mb-0.5">
              <span className="font-medium">Close Hrs:</span> {closeHrs}
            </div>
          </>
        )}

        {addressText && (
          <div className="text-sm text-gray-600 mb-0.5">
            <span className="font-medium">Address:</span> {addressText}
          </div>
        )}

        {phoneNumber && (
          <div className="text-sm text-gray-600 mb-0.5">
            <span className="font-medium">Phone:</span> {phoneNumber}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <span className="font-medium">Category:</span> {category?.join(', ')}
        </div>

        {showImage &&
          (imageUrl ? (
            <img src={imageUrl} alt="" className="mt-3 h-32 w-full rounded object-cover" />
          ) : (
            <div className="mt-3 flex h-32 items-center justify-center rounded bg-gray-100">
              <ImageOff aria-label="No image" className="h-10 w-10 text-gray-400" />
            </div>
          ))}
      </div>
    </>
  );
}
