'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProgressBar } from '@/components/ProgressBar';
import { StepEvent } from '@/components/StepEvent';
import { StepLocation } from '@/components/StepLocation';
import { StepAttractions } from '@/components/StepAttractions';
import { StepDuration } from '@/components/StepDuration';
import { StepSummary } from '@/components/StepSummary';
import { StepSuccess } from '@/components/StepSuccess';
import { LivePriceFloatingBar } from '@/components/LivePriceFloatingBar';
import {
  CompanySetting,
  ServiceItem,
  ComboItem,
  CharacterItem,
  TollItem,
  QuoteFormData,
  QuoteCalculationResult,
} from '@/lib/types';
import { calculateQuote } from '@/lib/calculator';
import { Loader2, Sparkles } from 'lucide-react';

const initialFormData: QuoteFormData = {
  clientName: '',
  clientWhatsapp: '',
  eventType: 'Casamento',
  eventDate: '',
  eventTime: '',
  guestCount: '',
  addressCep: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: 'SP',
  distanceOneWayKm: 0,
  manualTollAmount: 0,
  selectedComboId: null,
  selectedServices: {},
  selectedCharacterIds: [],
  durationHours: 1.0,
  notes: '',
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuoteFormData>(initialFormData);

  // Loaded database entities
  const [setting, setSetting] = useState<CompanySetting | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [tolls, setTolls] = useState<TollItem[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedQuoteResult, setSavedQuoteResult] = useState<any>(null);

  // Fetch initial setup data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/public/data');
        const data = await res.json();
        if (data.setting) setSetting(data.setting);
        if (data.services) setServices(data.services);
        if (data.combos) setCombos(data.combos);
        if (data.characters) setCharacters(data.characters);
        if (data.tolls) setTolls(data.tolls);
      } catch (err) {
        console.error('Failed to load quote catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const updateFormData = (fields: Partial<QuoteFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // Perform live client-side calculation preview
  const liveCalculation: QuoteCalculationResult = React.useMemo(() => {
    if (!setting) {
      return {
        selectedCombo: null,
        selectedServices: [],
        selectedCharacters: [],
        servicesSubtotal: 0,
        shipping: {
          distanceOneWayKm: 0,
          distanceTotalKm: 0,
          vehicleConsumptionKmL: 10,
          gasPricePerLiter: 7,
          litersNeeded: 0,
          fuelCost: 0,
          marginCost: 30,
          tollsCost: 0,
          calculatedShipping: 0,
          minShippingPrice: 50,
          appliedMinShipping: false,
          finalShipping: 0,
        },
        totalAmount: 0,
      };
    }

    const selectedCharObjects = characters.filter((c) =>
      formData.selectedCharacterIds.includes(c.id)
    );
    const selectedCharNames = selectedCharObjects.map((c) => c.name);

    return calculateQuote({
      setting,
      allServices: services,
      allCombos: combos,
      selectedComboId: formData.selectedComboId,
      selectedServicesMap: formData.selectedServices,
      selectedCharacterNames: selectedCharNames,
      distanceOneWayKm: formData.distanceOneWayKm || 0,
      manualTollAmount: formData.manualTollAmount || 0,
      generalDurationHours: formData.durationHours || 1.0,
    });
  }, [setting, services, combos, characters, formData]);

  // Handle final submission to create official quote record
  const handleSubmitQuote = async () => {
    if (!setting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientWhatsapp: formData.clientWhatsapp,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          guestCount: formData.guestCount,
          addressFull: formData.addressFull || `${formData.addressCity} - ${formData.addressState}`,
          addressCep: formData.addressCep,
          addressCity: formData.addressCity,
          addressState: formData.addressState,
          distanceOneWayKm: formData.distanceOneWayKm,
          manualTollAmount: formData.manualTollAmount,
          selectedComboId: formData.selectedComboId,
          selectedServices: formData.selectedServices,
          selectedCharacterIds: formData.selectedCharacterIds,
          durationHours: formData.durationHours,
          notes: formData.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedQuoteResult(data);
        setCurrentStep(6);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Erro ao gerar orçamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao processar orçamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setSavedQuoteResult(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a10] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-400 tracking-wider uppercase">
          Carregando Cotação Robô LED Partner...
        </span>
      </div>
    );
  }

  const defaultSetting: CompanySetting = setting || {
    id: 'default',
    companyName: 'Robô LED Partner',
    originCep: '09710-000',
    originStreet: 'Centro',
    originNumber: '1000',
    originComplement: '',
    originNeighborhood: 'Centro',
    originCity: 'São Bernardo do Campo',
    originState: 'SP',
    originLat: -23.7000,
    originLng: -46.5500,
    vehicleConsumptionKmL: 10.0,
    gasPricePerLiter: 7.00,
    displacementMarginFixed: 30.00,
    minShippingPrice: 50.00,
    whatsappPhone: '5511919973647',
    instagramUrl: 'https://www.instagram.com/roboledpartner/',
    linktreeUrl: 'https://linktr.ee/roboledpartner',
    maxEventsPerDay: 2,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a10] text-slate-100">
      <Header setting={defaultSetting} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-28">
        {/* Step Progress Tracker */}
        {currentStep <= 5 && (
          <ProgressBar
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
        )}

        {/* STEP 1: EVENT DETAILS */}
        {currentStep === 1 && (
          <StepEvent
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => {
              setCurrentStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* STEP 2: LOCATION & ROUTE */}
        {currentStep === 2 && (
          <StepLocation
            formData={formData}
            updateFormData={updateFormData}
            setting={defaultSetting}
            tollsList={tolls}
            onNext={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* STEP 3: ATTRACTIONS & COMBOS */}
        {currentStep === 3 && (
          <StepAttractions
            formData={formData}
            updateFormData={updateFormData}
            services={services}
            combos={combos}
            characters={characters}
            onNext={() => {
              setCurrentStep(4);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setCurrentStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* STEP 4: DURATION & NOTES */}
        {currentStep === 4 && (
          <StepDuration
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => {
              setCurrentStep(5);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* STEP 5: SUMMARY & COMMERCIAL PROPOSAL */}
        {currentStep === 5 && (
          <StepSummary
            formData={formData}
            quoteCalc={liveCalculation}
            setting={defaultSetting}
            services={services}
            combos={combos}
            characters={characters}
            onSubmitQuote={handleSubmitQuote}
            isSubmitting={isSubmitting}
            onBack={() => {
              setCurrentStep(4);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* STEP 6: CONVERSION & SUCCESS */}
        {currentStep === 6 && savedQuoteResult && (
          <StepSuccess
            quote={savedQuoteResult.quote}
            whatsappUrl={savedQuoteResult.whatsappUrl}
            instagramUrl={savedQuoteResult.instagramUrl}
            linktreeUrl={savedQuoteResult.linktreeUrl}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Floating Bottom Bar with Live Total & Fast Next Button */}
      <LivePriceFloatingBar
        currentStep={currentStep}
        quoteCalc={liveCalculation}
        onNext={() => {
          if (currentStep < 5) {
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (currentStep === 5) {
            handleSubmitQuote();
          }
        }}
        canAdvance={
          currentStep === 1
            ? Boolean(formData.clientName && formData.clientWhatsapp && formData.eventDate)
            : currentStep === 2
            ? Boolean(formData.distanceOneWayKm && formData.distanceOneWayKm > 0)
            : currentStep === 3
            ? Boolean(formData.selectedComboId || Object.values(formData.selectedServices || {}).some((s) => s.selected))
            : true
        }
        nextButtonText={
          currentStep === 1
            ? 'Ir para Localização'
            : currentStep === 2
            ? 'Ir para Atrações'
            : currentStep === 3
            ? 'Ir para Duração'
            : currentStep === 4
            ? 'Ver Resumo Comercial'
            : undefined
        }
      />

      <Footer setting={defaultSetting} />
    </div>
  );
}
