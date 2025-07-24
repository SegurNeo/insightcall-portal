import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: number; // Número de páginas a mostrar alrededor de la actual
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPageNumbers = 5 
}: PaginationProps) {
  // Ajustar número de páginas según el tamaño de pantalla
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const effectiveShowPageNumbers = isMobile ? 3 : showPageNumbers;

  // Generar array de números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= effectiveShowPageNumbers + 2) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica compleja para páginas con elipsis
      const startPage = Math.max(1, currentPage - Math.floor(effectiveShowPageNumbers / 2));
      const endPage = Math.min(totalPages, startPage + effectiveShowPageNumbers - 1);
      
      // Ajustar startPage si estamos cerca del final
      const adjustedStartPage = Math.max(1, Math.min(startPage, totalPages - effectiveShowPageNumbers + 1));
      const adjustedEndPage = Math.min(totalPages, adjustedStartPage + effectiveShowPageNumbers - 1);
      
      // Siempre mostrar primera página
      if (adjustedStartPage > 1) {
        pages.push(1);
        if (adjustedStartPage > 2) {
          pages.push('ellipsis');
        }
      }
      
      // Páginas del rango
      for (let i = adjustedStartPage; i <= adjustedEndPage; i++) {
        pages.push(i);
      }
      
      // Siempre mostrar última página
      if (adjustedEndPage < totalPages) {
        if (adjustedEndPage < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav 
      className="flex items-center justify-center space-x-1" 
      aria-label="Navegación de páginas"
    >
      {/* Botón Anterior */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-2 sm:px-3 py-2 h-9"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      {/* Números de página */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Más páginas</span>
              </div>
            );
          }

          const isActive = currentPage === page;

          return (
            <Button
              key={page}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "h-9 w-9 p-0 text-sm",
                isActive && "bg-primary text-primary-foreground shadow"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Ir a página ${page}`}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-2 sm:px-3 py-2 h-9"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
