import React, { useState } from 'react';
import { ShippingOrder, PackageType, CarrierType, AppSetting, formatOrderId } from '../types';
import { getCountryFlag } from './Dashboard';
import {
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  Package,
  Tag,
  RefreshCw,
} from 'lucide-react';

export interface RateOption {
  carrier: CarrierType;
  serviceLevel: string;
  rate: number;
  deliveryDays: string;
  isCheapest: boolean;
  isFastest: boolean;
  isRecommended: boolean;
  notes?: string;
  disabled?: boolean;
}

interface CompareRatesModalProps {
  order: ShippingOrder;
  packages: PackageType[];
  settings?: AppSetting;
  onClose: () => void;
  onSelectRate: (orderId: string, carrier: CarrierType, serviceLevel: string, rate: number) => Promise<void>;
  onPurchaseLabel?: (orderId: string, carrier?: CarrierType, serviceLevel?: string, rateCost?: number) => Promise<void>;
}

export function getCalculatedRatesForOrder(order: ShippingOrder, defaultCarrier?: CarrierType, defaultService?: string): RateOption[] {
  const rawCountry = (order.country || 'US').trim().toUpperCase();
  const isInternational =
    rawCountry !== 'US' &&
    rawCountry !== 'USA' &&
    rawCountry !== 'UNITED STATES' &&
    rawCountry !== 'UNITED STATES OF AMERICA';

  const weightLbs = Math.max(0.5, (order.weightOz || 16) / 16);

  if (!isInternational) {
    // Domestic US Shipment Rates across carriers
    const uspsGroundRate = Number((5.25 + weightLbs * 0.75).toFixed(2));
    const uspsPriorityRate = Number((7.85 + weightLbs * 1.15).toFixed(2));
    const uspsExpressRate = Number((24.95 + weightLbs * 1.85).toFixed(2));

    const upsGroundRate = Number((8.50 + weightLbs * 1.10).toFixed(2));
    const ups2DayRate = Number((18.50 + weightLbs * 1.60).toFixed(2));

    const fedexGroundRate = Number((8.75 + weightLbs * 1.15).toFixed(2));
    const fedex2DayRate = Number((19.00 + weightLbs * 1.65).toFixed(2));

    const targetCarrier = defaultCarrier || 'USPS';
    const targetService = defaultService || 'Priority';

    const options: RateOption[] = [
      {
        carrier: 'USPS',
        serviceLevel: 'Priority Mail 2-Day',
        rate: uspsPriorityRate,
        deliveryDays: '2 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'USPS standard 2-day delivery with commercial discount',
      },
      {
        carrier: 'USPS',
        serviceLevel: 'Ground Advantage',
        rate: uspsGroundRate,
        deliveryDays: '3-5 Business Days',
        isCheapest: true,
        isFastest: false,
        isRecommended: false,
        notes: 'Lowest cost economy domestic option',
      },
      {
        carrier: 'USPS',
        serviceLevel: 'Priority Mail Express',
        rate: uspsExpressRate,
        deliveryDays: '1 Business Day (Overnight)',
        isCheapest: false,
        isFastest: true,
        isRecommended: false,
        notes: 'Guaranteed overnight delivery',
      },
      {
        carrier: 'UPS',
        serviceLevel: 'UPS Ground',
        rate: upsGroundRate,
        deliveryDays: '1-5 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Reliable ground shipping for heavier packages',
      },
      {
        carrier: 'UPS',
        serviceLevel: 'UPS 2nd Day Air',
        rate: ups2DayRate,
        deliveryDays: '2 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Guaranteed 2-day delivery across 50 US states',
      },
      {
        carrier: 'FedEx',
        serviceLevel: 'FedEx Ground',
        rate: fedexGroundRate,
        deliveryDays: '1-5 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Commercial ground network coverage',
      },
      {
        carrier: 'FedEx',
        serviceLevel: 'FedEx 2Day',
        rate: fedex2DayRate,
        deliveryDays: '2 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Express 2-day business delivery',
      },
    ];

    // Set recommended based on default carrier settings
    let foundMatch = false;
    options.forEach((opt) => {
      const isCarrierMatch = opt.carrier.toUpperCase() === targetCarrier.toUpperCase();
      const sLower = opt.serviceLevel.toLowerCase();
      const tLower = targetService.toLowerCase();

      let isServiceMatch = sLower.includes(tLower);
      if (tLower === 'priority') {
        isServiceMatch = sLower.includes('priority') && !sLower.includes('express');
      } else if (tLower === 'ground advantage') {
        isServiceMatch = sLower.includes('ground advantage') || sLower.includes('groundadvantage');
      } else if (tLower === 'express') {
        isServiceMatch = sLower.includes('express');
      } else if (tLower === 'ground') {
        isServiceMatch = sLower.includes('ground');
      } else if (tLower === '2day') {
        isServiceMatch = sLower.includes('2nd day') || sLower.includes('2day');
      } else if (tLower === 'nextday' || tLower === 'priority overnight') {
        isServiceMatch = sLower.includes('next day') || sLower.includes('overnight');
      }

      if (isCarrierMatch && isServiceMatch) {
        opt.isRecommended = true;
        foundMatch = true;
      }
    });
    if (!foundMatch) {
      const carrierMatch = options.find((opt) => opt.carrier.toUpperCase() === targetCarrier.toUpperCase());
      if (carrierMatch) carrierMatch.isRecommended = true;
      else options[0].isRecommended = true;
    }

    return options;
  } else {
    // International Shipment Rates (USPS vs UPS Rate Comparison)
    const uspsPriorityIntl = Number((38.50 + weightLbs * 3.40).toFixed(2));
    const uspsFirstClassIntl = Number((21.50 + weightLbs * 2.10).toFixed(2));
    const upsExpeditedIntl = Number((32.50 + weightLbs * 2.85).toFixed(2));
    const upsSaverIntl = Number((47.50 + weightLbs * 4.10).toFixed(2));

    const options: RateOption[] = [
      {
        carrier: 'UPS',
        serviceLevel: 'UPS Worldwide Expedited',
        rate: upsExpeditedIntl,
        deliveryDays: '2-5 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Fast commercial customs brokerage & door-to-door tracking',
      },
      {
        carrier: 'USPS',
        serviceLevel: 'Priority Mail International',
        rate: uspsPriorityIntl,
        deliveryDays: '6-10 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Standard postal delivery via destination national post',
      },
      {
        carrier: 'UPS',
        serviceLevel: 'UPS Worldwide Saver',
        rate: upsSaverIntl,
        deliveryDays: '1-3 Business Days',
        isCheapest: false,
        isFastest: true,
        isRecommended: false,
        notes: 'Express courier delivery guaranteed by end of day',
      },
    ];

    if (order.weightOz <= 64) {
      options.push({
        carrier: 'USPS',
        serviceLevel: 'First-Class Package International',
        rate: uspsFirstClassIntl,
        deliveryDays: '7-21 Business Days',
        isCheapest: false,
        isFastest: false,
        isRecommended: false,
        notes: 'Economy postal option for light packages under 4 lbs',
      });
    }

    // Calculate cheapest
    const minRate = Math.min(...options.map((o) => o.rate));
    options.forEach((o) => {
      if (o.rate === minRate) {
        o.isCheapest = true;
        o.isRecommended = true;
      }
    });

    return options;
  }
}

export const CompareRatesModal: React.FC<CompareRatesModalProps> = ({
  order,
  packages,
  settings,
  onClose,
  onSelectRate,
  onPurchaseLabel,
}) => {
  const rates = getCalculatedRatesForOrder(order, settings?.defaultDomesticCarrier, settings?.defaultDomesticService);
  const countryFlag = getCountryFlag(order.country);
  const rawCountry = (order.country || 'US').trim().toUpperCase();
  const isInternational =
    rawCountry !== 'US' &&
    rawCountry !== 'USA' &&
    rawCountry !== 'UNITED STATES' &&
    rawCountry !== 'UNITED STATES OF AMERICA';

  // Find initial selected, recommended default, or cheapest
  const initialOption =
    rates.find((r) => r.carrier === order.carrier && r.serviceLevel === order.serviceLevel) ||
    rates.find((r) => r.isRecommended && !r.disabled) ||
    rates.find((r) => r.isCheapest && !r.disabled) ||
    rates[0];

  const [selectedRate, setSelectedRate] = useState<RateOption>(initialOption);
  const [saving, setSaving] = useState(false);

  const box = packages.find((p) => p.id === order.boxId);

  const handleApplyRate = async () => {
    if (selectedRate.disabled) return;
    setSaving(true);
    await onSelectRate(
      order.id,
      selectedRate.carrier,
      selectedRate.serviceLevel,
      selectedRate.rate
    );
    setSaving(false);
    onClose();
  };

  const handlePurchaseLabel = async () => {
    if (selectedRate.disabled) return;
    setSaving(true);
    if (onPurchaseLabel) {
      await onPurchaseLabel(
        order.id,
        selectedRate.carrier,
        selectedRate.serviceLevel,
        selectedRate.rate
      );
    } else {
      await onSelectRate(
        order.id,
        selectedRate.carrier,
        selectedRate.serviceLevel,
        selectedRate.rate
      );
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-900">Carrier Rate Comparison</h2>
              <span className="bg-slate-100 text-slate-700 font-mono text-xs font-bold px-2 py-0.5 rounded border border-slate-200">
                #{formatOrderId(order.orderNumber)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare real-time EasyPost shipping rates between <strong>USPS</strong> and <strong>UPS</strong>.
            </p>
          </div>
        </div>

        {/* Order Details Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Destination:</span>{' '}
            <strong className="text-slate-900">{order.recipientName}</strong> &bull; {order.city},{' '}
            {order.state} {order.zip}{' '}
            {countryFlag ? (
              <span className="inline-flex items-center justify-center font-bold text-slate-900 ml-1 text-sm shrink-0" title={`Country: ${order.country}`}>
                <span>{countryFlag.flag}</span>
              </span>
            ) : (
              <span className="font-bold text-slate-800">({order.country || 'US'})</span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-slate-600">
            <span className="flex items-center space-x-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>{box?.name || order.boxName || 'Package Box'}</span>
            </span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-900">
              {(order.weightOz / 16).toFixed(1)} lbs ({order.weightOz} oz)
            </span>
          </div>
        </div>

        {/* Business Policy Banner */}
        {!isInternational ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex items-start space-x-2.5">
            <Truck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">🇺🇸 Domestic Shipping Rate Comparison</div>
              <p className="text-indigo-800 text-[11px] mt-0.5">
                Default domestic carrier: <strong>{settings?.defaultDomesticCarrier || 'USPS'}</strong> ({settings?.defaultDomesticService || 'Priority'}). You can compare rates across USPS, UPS, and FedEx and select your preferred carrier option below.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">🌐 International Rate Match (USPS vs UPS)</div>
              <p className="text-blue-800 text-[11px] mt-0.5">
                International shipments allow choosing between <strong>USPS</strong> and <strong>UPS</strong> based on rates, delivery time, and customs brokerage. Select your preferred option below.
              </p>
            </div>
          </div>
        )}

        {/* Rate Comparison Options Cards */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {rates.map((option, idx) => {
            const isSelected =
              selectedRate.carrier === option.carrier &&
              selectedRate.serviceLevel === option.serviceLevel;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (!option.disabled) setSelectedRate(option);
                }}
                className={`border rounded-xl p-4 transition-all ${
                  option.disabled
                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-sm cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Carrier Icon & Service */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        option.carrier === 'USPS'
                          ? 'bg-blue-900 text-white'
                          : 'bg-amber-800 text-amber-200'
                      }`}
                    >
                      {option.carrier}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-sm text-slate-900">
                          {option.carrier} {option.serviceLevel}
                        </span>

                        {option.isCheapest && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Lowest Rate
                          </span>
                        )}

                        {option.isFastest && (
                          <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Fastest
                          </span>
                        )}

                        {option.isRecommended && !option.isCheapest && (
                          <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Recommended
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                        <span className="flex items-center space-x-1 font-medium text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Est. Transit: {option.deliveryDays}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rate Price */}
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">
                      ${option.rate.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">USD</div>
                  </div>
                </div>

                {/* Notes & Lock Message */}
                {option.notes && (
                  <p className="text-[11px] text-slate-500 border-t border-slate-200/60 mt-2.5 pt-2">
                    {option.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Selected: <strong className="text-slate-900">{selectedRate.carrier} {selectedRate.serviceLevel}</strong> (${selectedRate.rate.toFixed(2)})
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApplyRate}
              disabled={saving || selectedRate.disabled}
              className="bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Applying...' : 'Set Rate Only'}</span>
            </button>

            <button
              onClick={handlePurchaseLabel}
              disabled={saving || selectedRate.disabled}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Purchase shipping label from EasyPost and save label PDF to database"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
              ) : (
                <Tag className="w-4 h-4 shrink-0" />
              )}
              <span>{saving ? 'Purchasing Label...' : 'Purchase Label (EasyPost)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
