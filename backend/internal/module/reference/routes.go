package reference

import "github.com/gin-gonic/gin"

// Reference directories are public — used by the catalog and product forms
// even for unauthenticated users.
func RegisterRoutes(api *gin.RouterGroup, svc *Service) {
	h := NewHandler(svc)

	api.GET("/countries", h.ListCountries)
	api.GET("/regions", h.ListRegions)
	api.GET("/categories", h.ListCategories)
}
