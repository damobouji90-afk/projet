import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface DailyWeather {
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  weatherCode: number;
  precipitation: number;
}

export interface WeatherData {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  condition: string;
  lastUpdated: string;
  daily: DailyWeather[];
}

interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  hourly: {
    time: string[];
    relativehumidity_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_sum: number[];
  };
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  getWeather(latitude: number, longitude: number): Observable<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`;

    return this.http.get<OpenMeteoResponse>(url).pipe(
      map((response) => {
        const currentTime = response.current_weather.time;
        const index = response.hourly.time.indexOf(currentTime);
        let humidity = index >= 0 ? response.hourly.relativehumidity_2m[index] : undefined;

        if (humidity === undefined && response.hourly.relativehumidity_2m.length > 0) {
          const lastValues = response.hourly.relativehumidity_2m.slice(-3);
          humidity = Math.round(lastValues.reduce((sum, value) => sum + value, 0) / lastValues.length);
        }

        const daily = response.daily.time.map((date, index) => ({
          date,
          minTemp: Math.round(response.daily.temperature_2m_min[index]),
          maxTemp: Math.round(response.daily.temperature_2m_max[index]),
          weatherCode: response.daily.weathercode[index],
          condition: this.mapWeatherCode(response.daily.weathercode[index]),
          precipitation: Math.round(response.daily.precipitation_sum[index]),
        }));

        return {
          temperature: response.current_weather.temperature,
          humidity: humidity !== undefined ? Math.round(humidity) : 0,
          windSpeed: Math.round(response.current_weather.windspeed),
          condition: this.mapWeatherCode(response.current_weather.weathercode),
          lastUpdated: response.current_weather.time,
          daily,
        };
      })
    );
  }

  private mapWeatherCode(code: number): string {
    const map: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };
    return map[code] ?? 'Unknown';
  }
}
