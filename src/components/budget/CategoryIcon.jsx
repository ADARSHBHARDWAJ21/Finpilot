"use client";

import {
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  Heart,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

const ICON_BY_KEY = {
  home: Home,
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  film: Film,
  zap: Zap,
  heart: Heart,
  "trending-up": TrendingUp,
  "more-horizontal": MoreHorizontal,
};

export default function CategoryIcon({ iconKey, size = 14, className = "" }) {
  const Icon = ICON_BY_KEY[iconKey] || MoreHorizontal;
  return <Icon size={size} className={className} />;
}
