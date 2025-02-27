"use client";

import React from "react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import companies from "@/data/companies";

const CompanyCarousel = () => {
  return (
    <Carousel
      plugins={[
        Autoplay({
          delay: 2000,
        }),
      ]}
      className="w-full py-10"
    >
      <CarouselContent className="flex gap-5 sm:gap-20 items-center">
        {companies.map(({ name, id, path }) => (
          <CarouselItem key={id} className="basis-1/2 lg:basis-1/3 flex justify-center">
            <Image
              src={path}
              alt={name}
              width={800}  // Increased by 400%
              height={224} // Increased by 400%
              className="h-36 sm:h-56 w-auto object-contain" // Increased height by 400%
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default CompanyCarousel;
