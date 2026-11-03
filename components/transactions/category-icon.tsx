"use client";

import {
  Briefcase,
  Building2,
  CalendarSync,
  Car,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MinusCircle,
  PiggyBank,
  Plane,
  PlusCircle,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

interface CategoryIconProps {
  iconName: string | null | undefined;
  className?: string;
}

export function CategoryIcon({ iconName, className = "size-4" }: CategoryIconProps) {
  switch (iconName?.toLowerCase()) {
    case "briefcase":
      return <Briefcase className={className} />;
    case "laptop":
      return <Laptop className={className} />;
    case "building2":
      return <Building2 className={className} />;
    case "trendingup":
      return <TrendingUp className={className} />;
    case "gift":
      return <Gift className={className} />;
    case "rotateccw":
      return <RotateCcw className={className} />;
    case "pluscircle":
      return <PlusCircle className={className} />;
    case "utensils":
      return <Utensils className={className} />;
    case "car":
      return <Car className={className} />;
    case "shoppingbag":
      return <ShoppingBag className={className} />;
    case "home":
      return <Home className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "heartpulse":
      return <HeartPulse className={className} />;
    case "graduationcap":
      return <GraduationCap className={className} />;
    case "film":
      return <Film className={className} />;
    case "plane":
      return <Plane className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "calendarsync":
      return <CalendarSync className={className} />;
    case "minuscircle":
      return <MinusCircle className={className} />;
    case "wallet":
      return <Wallet className={className} />;
    case "piggybank":
      return <PiggyBank className={className} />;
    default:
      return <Tag className={className} />;
  }
}

