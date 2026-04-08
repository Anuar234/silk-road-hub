package deal

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetPayments(c *gin.Context) {
	plan, err := h.svc.GetPaymentPlan(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.OK(c, http.StatusOK, nil)
		return
	}
	apierror.OK(c, http.StatusOK, plan)
}

func (h *Handler) CreatePaymentPlan(c *gin.Context) {
	var in CreatePaymentPlanInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	plan, err := h.svc.CreatePaymentPlan(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, plan)
}

func (h *Handler) UpdatePaymentStage(c *gin.Context) {
	var in UpdatePaymentStageInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.UpdatePaymentStage(c.Request.Context(), c.Param("id"), &in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}

func (h *Handler) GetGuarantees(c *gin.Context) {
	guarantees, err := h.svc.GetGuarantees(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, guarantees)
}

func (h *Handler) SetGuarantee(c *gin.Context) {
	var in SetGuaranteeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.SetGuarantee(c.Request.Context(), c.Param("id"), &in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}
