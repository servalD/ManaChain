/**
 * Utilitaires de transformation entre snake_case (PostgreSQL) et camelCase (Frontend)
 */

export class DataTransformer {
    /**
     * Transforme un login de snake_case à camelCase
     */
    static transformLogin(login: any): any {
        if (!login) return null;
        return {
            id: login.id,
            loginName: login.login_name
        };
    }

    /**
     * Transforme un customer de snake_case à camelCase
     */
    static transformCustomer(customer: any): any {
        if (!customer) return null;
        return {
            id: customer.id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            loginId: customer.login_id
        };
    }

    /**
     * Transforme une car brand de snake_case à camelCase
     */
    static transformCarBrand(carBrand: any): any {
        if (!carBrand) return null;
        return {
            id: carBrand.id,
            brandName: carBrand.brand_name
        };
    }

    /**
     * Transforme un car model de snake_case à camelCase
     */
    static transformCarModel(carModel: any): any {
        if (!carModel) return null;
        return {
            id: carModel.id,
            modelName: carModel.model_name,
            brandId: carModel.brand_id
        };
    }

    /**
     * Transforme un item de snake_case à camelCase
     */
    static transformItem(item: any): any {
        if (!item) return null;
        return {
            id: item.id,
            itemName: item.item_name
        };
    }

    /**
     * Transforme un supplier de snake_case à camelCase
     */
    static transformSupplier(supplier: any): any {
        if (!supplier) return null;
        return {
            id: supplier.id,
            supplierName: supplier.supplier_name
        };
    }

    /**
     * Transforme une registration de snake_case à camelCase
     */
    static transformRegistration(registration: any): any {
        if (!registration) return null;
        return {
            id: registration.id,
            registrationName: registration.registration_name
        };
    }

    /**
     * Transforme un user de snake_case à camelCase
     */
    static transformUser(user: any): any {
        if (!user) return null;
        return {
            id: user.id,
            email: user.email,
            pw: user.pw
        };
    }

    /**
     * Transforme une session de snake_case à camelCase
     */
    static transformSession(session: any): any {
        if (!session) return null;
        return {
            userId: session.user_id,
            expirationDate: session.expiration_date,
            token: session.token
        };
    }

    /**
     * Transforme un loaner car de snake_case à camelCase
     */
    static transformLoanerCar(loanerCar: any): any {
        if (!loanerCar) return null;

        try {
            const brand = loanerCar.brand ? (Array.isArray(loanerCar.brand) ? loanerCar.brand[0] : loanerCar.brand) : null;
            const model = loanerCar.model ? (Array.isArray(loanerCar.model) ? loanerCar.model[0] : loanerCar.model) : null;
            const registration = loanerCar.registration ? (Array.isArray(loanerCar.registration) ? loanerCar.registration[0] : loanerCar.registration) : null;

            return {
                id: loanerCar.id,
                carBrandId: loanerCar.car_brand_id,
                carModelId: loanerCar.car_model_id,
                registrationId: loanerCar.registration_id,
                status: loanerCar.status,
                isDeleted: loanerCar.is_deleted,
                brand: brand ? this.transformCarBrand(brand) : null,
                model: model ? this.transformCarModel(model) : null,
                registration: registration ? this.transformRegistration(registration) : null
            };
        } catch (error) {
            console.error('Error transforming loanerCar:', error, loanerCar);
            return null;
        }
    }

    /**
     * Transforme un loan de snake_case à camelCase
     */
    static transformLoan(loan: any): any {
        if (!loan) return null;

        try {
            const loanerCar = loan.loanerCar ? (Array.isArray(loan.loanerCar) ? loan.loanerCar[0] : loan.loanerCar) : null;
            const customer = loan.customer ? (Array.isArray(loan.customer) ? loan.customer[0] : loan.customer) : null;

            return {
                id: loan.id,
                loanerCarId: loan.loaner_car_id,
                orNumber: loan.or_number,
                customerId: loan.customer_id,
                startDate: loan.start_date,
                endDate: loan.end_date,
                notes: loan.notes,
                loanerCar: loanerCar ? this.transformLoanerCar(loanerCar) : null,
                customer: customer ? this.transformCustomer(customer) : null
            };
        } catch (error) {
            console.error('Error transforming loan:', error, loan);
            return null;
        }
    }

    /**
     * Transforme un order detail de snake_case à camelCase
     */
    static transformOrderDetail(orderDetail: any): any {
        if (!orderDetail) return null;

        try {
            const item = orderDetail.item ? (Array.isArray(orderDetail.item) ? orderDetail.item[0] : orderDetail.item) : null;

            return {
                id: orderDetail.id,
                quantity: orderDetail.quantity,
                itemId: orderDetail.item_id,
                orderId: orderDetail.order_id,
                item: item ? this.transformItem(item) : null
            };
        } catch (error) {
            console.error('Error transforming orderDetail:', error, orderDetail);
            return null;
        }
    }

    /**
     * Transforme un order de snake_case à camelCase (complet avec tous les détails)
     */
    static transformOrder(order: any): any {
        if (!order) return null;

        try {
            const customer = order.customer ? (Array.isArray(order.customer) ? order.customer[0] : order.customer) : null;
            const login = order.login ? (Array.isArray(order.login) ? order.login[0] : order.login) : null;
            const carBrand = order.car_brand ? (Array.isArray(order.car_brand) ? order.car_brand[0] : order.car_brand) : null;
            const carModel = order.car_model ? (Array.isArray(order.car_model) ? order.car_model[0] : order.car_model) : null;
            const supplier = order.supplier ? (Array.isArray(order.supplier) ? order.supplier[0] : order.supplier) : null;
            const registration = order.registration ? (Array.isArray(order.registration) ? order.registration[0] : order.registration) : null;

            return {
                id: order.id,
                creationDate: order.creation_date,
                customerId: order.customer_id,
                carBrandId: order.car_brand_id,
                carModelId: order.car_model_id,
                supplierId: order.supplier_id,
                loginId: order.login_id,
                registrationId: order.registration_id,
                notes: order.notes,
                orderDetails: order.order_detail ? order.order_detail.map((detail: any) => this.transformOrderDetail(detail)) : [],
                customer: customer ? this.transformCustomer(customer) : null,
                login: login ? this.transformLogin(login) : null,
                carBrand: carBrand ? this.transformCarBrand(carBrand) : null,
                carModel: carModel ? this.transformCarModel(carModel) : null,
                supplier: supplier ? this.transformSupplier(supplier) : null,
                registration: registration ? this.transformRegistration(registration) : null
            };
        } catch (error) {
            console.error('Error transforming order:', error, order);
            return null;
        }
    }
}

