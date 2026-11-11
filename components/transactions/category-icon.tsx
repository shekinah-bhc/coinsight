"use client";

import {
  BookOpen,
  Briefcase,
  Building2,
  CalendarSync,
  Car,
  Coffee,
  Coins,
  Dumbbell,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  MinusCircle,
  Music,
  PiggyBank,
  Plane,
  PlusCircle,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";

export interface CategoryIconProps {
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
    case "shoppingcart":
      return <ShoppingCart className={className} />;
    case "coffee":
      return <Coffee className={className} />;
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
    case "smartphone":
      return <Smartphone className={className} />;
    case "dumbbell":
      return <Dumbbell className={className} />;
    case "shieldcheck":
      return <ShieldCheck className={className} />;
    case "landmark":
      return <Landmark className={className} />;
    case "coins":
      return <Coins className={className} />;
    case "receipt":
      return <Receipt className={className} />;
    case "wrench":
      return <Wrench className={className} />;
    case "bookopen":
      return <BookOpen className={className} />;
    case "music":
      return <Music className={className} />;
    case "gamepad2":
      return <Gamepad2 className={className} />;
    case "shirt":
      return <Shirt className={className} />;
    default:
      return <Tag className={className} />;
  }
}
