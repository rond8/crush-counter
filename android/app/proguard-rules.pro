# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }
-keep class **.R$* {
    <fields>;
}
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes Signature
-keepattributes InnerClasses

# Supabase / Postgrest / GoTrue
-keep class com.supabase.** { *; }
-keep class io.supabase.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-dontwarn retrofit2.**

# AdMob
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# RevenueCat
-keep class com.revenuecat.purchases.** { *; }
-dontwarn com.revenuecat.purchases.**

# Google Play Services (required by many plugins)
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Firebase (if used)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
